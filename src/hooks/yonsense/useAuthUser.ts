import { db } from '@/lib/db';
import { createDisplayName } from '@/lib/utils';
import { id } from '@instantdb/react';
import { useCallback, useMemo } from 'react';

export const useAuthUser = () => {
    const timestamp = new Date().toISOString();
    const { user } = db.useAuth();

    const {
        data: AllProfiles,
        isLoading: isLoadingAllProfiles,
        error: errorAllProfiles,
    } = db.useQuery({
        profiles: {},
    });
    const {
        data: CurrentProfile,
        isLoading: isLoadingCurrentProfile,
        error: errorCurrentProfile,
    } = db.useQuery({
        profiles: {
            $: {
                where: { email: user?.email },
                limit: 1,
            },
        },
    });

    const currentProfile = useMemo(() => CurrentProfile?.profiles?.[0], [CurrentProfile?.profiles, user]);
    const allProfiles = useMemo(() => AllProfiles?.profiles, [AllProfiles?.profiles, user]);

    const updateProfile = useCallback(
        async (updates: ProfileUpdate): Promise<void> => {
            if (!currentProfile?.id) {
                throw new Error('No profile found to update');
            }

            try {
                await db.transact([
                    db.tx.profiles[currentProfile.id].update({
                        ...updates,
                        updatedAt: new Date().toISOString(),
                    }),
                ]);
            } catch (error) {
                console.error('Failed to update profile:', error);
                throw new Error('Profile update failed');
            }
        },
        [currentProfile?.id],
    );

    const addNewUserProfile = useCallback(
        async (authUser: JWTPayload, userId: string) => {
            await db.transact([
                db.tx.profiles[id()].create({
                    displayName: createDisplayName(authUser),
                    picture: authUser.picture || '',
                    email: authUser.email,
                    userId,
                    createdAt: timestamp,
                }),
            ]);
        },
        [timestamp],
    );

    return {
        user,
        currentProfile,
        allProfiles,
        isLoading: isLoadingAllProfiles || isLoadingCurrentProfile,
        error: errorAllProfiles || errorCurrentProfile,
        updateProfile,
        addNewUserProfile,
    };
};
