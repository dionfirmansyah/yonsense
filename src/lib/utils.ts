import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const parseIdToken = (idToken: string): JWTPayload => {
    try {
        const base64Payload = idToken.split('.')[1];
        const decoded = atob(base64Payload);
        return JSON.parse(decoded);
    } catch {
        throw new Error('Invalid JWT token format');
    }
};

export const generateNonce = (): string => crypto.randomUUID();

export const createDisplayName = (authUser: JWTPayload): string => {
    if (authUser.name) return authUser.name;
    const fullName = `${authUser.given_name || ''} ${authUser.family_name || ''}`.trim();
    return fullName || 'User';
};

export const createInitial = (displayName: string | undefined): string => {
    if (!displayName) return 'U';
    const initial = displayName
        .split(' ')
        .map((i) => i[0])
        .join('')
        .toUpperCase();

    return initial;
};
