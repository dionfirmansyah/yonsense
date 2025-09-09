'use client';

import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { generateNonce, parseIdToken } from '@/lib/utils';
import { GoogleOAuthProvider } from '@react-oauth/google';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import LoginModal from './LoginModal';

// Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom Hooks
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// export const useProfile = () => {
//     const { user, profile } = useAuth();

//     const { isLoading, data, error } = db.useQuery(
//         user?.id
//             ? {
//                   profiles: {
//                       $: { where: { userId: user.id } },
//                   },
//               }
//             : null,
//     );

//     const currentProfile = useMemo(() => data?.profiles?.[0] || profile, [data?.profiles, profile]);

//     const updateProfile = useCallback(
//         async (updates: ProfileUpdate): Promise<void> => {
//             if (!currentProfile?.id) {
//                 throw new Error('No profile found to update');
//             }

//             try {
//                 await db.transact([
//                     db.tx.profiles[currentProfile.id].update({
//                         ...updates,
//                         updatedAt: new Date().toISOString(),
//                     }),
//                 ]);
//             } catch (error) {
//                 console.error('Failed to update profile:', error);
//                 throw new Error('Profile update failed');
//             }
//         },
//         [currentProfile?.id],
//     );

//     return {
//         profile: currentProfile,
//         isLoading,
//         error,
//         updateProfile,
//     };
// };

// Main Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [showLogin, setShowLogin] = useState(false);
    const [nonce] = useState(generateNonce);

    const { updateProfile, addNewUserProfile, allProfiles, user } = useAuthUser();

    // Profile sync logic
    const syncUserProfile = useCallback(
        async (authUser: JWTPayload, userId: string): Promise<void> => {
            try {
                if (!userId) {
                    return;
                }

                const userTarget = allProfiles?.find((u) => u.email === authUser.email);

                console.log(userTarget);

                if (userTarget) {
                    if (authUser.picture !== userTarget.picture) {
                        await updateProfile({ picture: authUser.picture });
                    }
                    return;
                }

                await addNewUserProfile(authUser, userId);
            } catch (error) {
                console.error('Failed to sync user profile:', error);
            }
        },
        [allProfiles, updateProfile, addNewUserProfile, user],
    );

    // Google Auth Handlers
    const handleGoogleSuccess = useCallback(
        async (credentialResponse: any): Promise<void> => {
            try {
                const credential = credentialResponse?.credential;
                if (!credential) {
                    throw new Error('No credential received from Google');
                }

                const parsedToken = parseIdToken(credential);

                const { user } = await db.auth.signInWithIdToken({
                    clientName: 'google-web',
                    idToken: credential,
                    nonce: nonce,
                });

                console.log('User signed in:', user.id);

                await syncUserProfile(parsedToken, user.id);
                setShowLogin(false);
            } catch (error: any) {
                const errorMessage = error.body?.message || error.message || 'Login failed';
                console.error('Google login error:', error);
                alert(`Login gagal: ${errorMessage}`);
            }
        },
        [nonce, syncUserProfile],
    );

    const handleGoogleError = useCallback((): void => {
        console.error('Google OAuth error occurred');
        alert('Login Google gagal. Silakan coba lagi.');
    }, []);

    // Auth Actions
    const login = useCallback((): void => {
        if (!env.googleClientId) {
            console.error('Google Client ID not configured');
            alert('Google OAuth not configured properly');
            return;
        }
        setShowLogin(true);
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        try {
            await db.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error during logout');
        }
    }, []);

    // Context value
    const contextValue = useMemo<AuthContextType>(
        () => ({
            login,
            logout,
        }),
        [login, logout],
    );

    if (!env.googleClientId) {
        return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
    }

    return (
        <AuthContext.Provider value={contextValue}>
            <GoogleOAuthProvider clientId={env.googleClientId}>
                {children}
                {showLogin && !user && (
                    <LoginModal
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        onClose={() => setShowLogin(false)}
                        nonce={nonce}
                    />
                )}
            </GoogleOAuthProvider>
        </AuthContext.Provider>
    );
};
