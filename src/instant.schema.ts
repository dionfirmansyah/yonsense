// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from '@instantdb/react';

const _schema = i.schema({
    entities: {
        $files: i.entity({
            path: i.string().unique().indexed(),
            url: i.string(),
        }),
        $users: i.entity({
            email: i.string().unique().indexed().optional(),
        }),
        profiles: i.entity({
            email: i.string().unique().indexed().optional(),
            displayName: i.string().optional(),
            picture: i.string().optional(),
            userId: i.string().indexed(),
            createdAt: i.date(),
            updatedAt: i.date().optional(),
        }),
        image_push_notifications: i.entity({
            createdAt: i.date().indexed().optional(),
            userId: i.string().indexed().optional(),
        }),
        subscriptions: i.entity({
            userId: i.string().indexed(),
            endpoint: i.string().indexed().unique(),
            pushSubscriptions: i.json(),
            isActive: i.boolean(),
            createdAt: i.date().optional(),
            updatedAt: i.date().optional(),
        }),
        notifications: i.entity({
            title: i.string(),
            body: i.string().optional(),
            data: i.json().optional(),
            read: i.boolean(),
            createdAt: i.date(),
        }),
        todos: i.entity({
            text: i.string(),
            done: i.boolean(),
            createdAt: i.number(),
        }),
    },
    links: {
        userPushSubscriptions: {
            forward: { on: 'subscriptions', has: 'many', label: 'user' },
            reverse: { on: '$users', has: 'many', label: 'subscriptions' },
        },
        userNotifications: {
            forward: { on: 'notifications', has: 'many', label: 'user' },
            reverse: { on: '$users', has: 'many', label: 'notifications' },
        },
        userProfiles: {
            forward: { on: 'profiles', has: 'one', label: 'user' },
            reverse: { on: '$users', has: 'one', label: 'profile' },
        },
        image_push_notifications$files: {
            forward: {
                on: 'image_push_notifications',
                has: 'one',
                label: 'image',
                required: true,
                onDelete: 'cascade',
            },
            reverse: {
                on: '$files',
                has: 'one',
                label: 'image_push_notifications',
                onDelete: 'cascade',
            },
        },
    },
    rooms: {
        todos: {
            presence: i.entity({}),
        },
    },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
