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

export type Profile = InstaQLEntity<typeof schema, 'profiles'>;
export type ImagePushNotification = InstaQLEntity<typeof schema, 'image_push_notifications'>;
export type Notification = InstaQLEntity<typeof schema, 'notifications'>;
export type NotificationTemplate = InstaQLEntity<typeof schema, 'notificationTemplates'>;
export type Segment = InstaQLEntity<typeof schema, 'segment'>;
export type SegmentUser = InstaQLEntity<typeof schema, 'segment_user'>;
