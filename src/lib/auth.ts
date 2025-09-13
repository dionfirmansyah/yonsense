import { NextRequest } from 'next/server';
import { dbAdmin } from './db';

async function verifyInstantDBToken(token: string) {
    try {
        const user = await dbAdmin.auth.verifyToken(token);
        return user;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

export async function authenticateAndAuthorize(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return {
            error: 'Missing or invalid authorization header',
            status: 401,
        };
    }

    const token = authHeader.substring(7);

    const user = await verifyInstantDBToken(token);
    if (!user) {
        return {
            error: 'Invalid or expired token',
            status: 401,
        };
    }

    if (!user.email || !user.email.includes('@')) {
        return {
            error: 'Invalid user authentication',
            status: 401,
        };
    }

    return { user };
}
