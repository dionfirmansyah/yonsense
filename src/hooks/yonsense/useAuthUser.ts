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
        $users: {
            role: {
                $: {
                    fields: ['type'],
                },
            },
        },
    });

    const currentProfile = useMemo(() => CurrentProfile?.profiles?.[0], [CurrentProfile?.profiles]);
    const allProfiles = useMemo(() => AllProfiles?.profiles, [AllProfiles?.profiles]);
    const role = useMemo(() => CurrentProfile?.$users?.[0]?.role?.type, [CurrentProfile]);

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
            try {
                const profileId = id();
                const roleId = id();

                await db.transact([
                    // create profile
                    db.tx.profiles[profileId]
                        .create({
                            displayName: createDisplayName(authUser),
                            picture: authUser.picture || '',
                            email: authUser.email,
                            userId,
                            createdAt: timestamp,
                        })
                        .link({ user: userId }),

                    // create role
                    db.tx.roles[roleId]
                        .create({
                            type: 'user',
                        })
                        .link({ users: userId }),
                ]);
            } catch (error) {
                console.error('Failed to add new user profile:', error);
                throw new Error('Profile creation failed');
            }
        },
        [timestamp],
    );

    return {
        user,
        currentProfile,
        allProfiles,
        role,
        isLoading: isLoadingAllProfiles || isLoadingCurrentProfile,
        error: errorAllProfiles || errorCurrentProfile,
        updateProfile,
        addNewUserProfile,
    };
};
