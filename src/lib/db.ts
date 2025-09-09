import { init as adminInit } from '@instantdb/admin';
import { init as clientInit, InstaQLEntity } from '@instantdb/react';
import schema from '../instant.schema';
import { env } from './env';

export const db = clientInit({
    appId: env.instantDbAppId!,
    schema,
    useDateObjects: true,
});

export const dbAdmin = adminInit({
    appId: env.instantDbAppId!,
    adminToken: process.env.INSTANT_ADMIN_TOKEN!,
    schema,
    useDateObjects: true,
});

export type Todo = InstaQLEntity<typeof schema, 'todos'>;
export type Profile = InstaQLEntity<typeof schema, 'profiles'>;
