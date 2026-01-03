import Notification from '../../models/notification.js';
import User from '../../models/user.js';
import { withFilter } from 'graphql-subscriptions';

const NotificationsResolver = {
    Query: {
        notificationsByUserId: async (_parent, { userId }, context) => {
            if (!context.isAuth || context.userId !== userId) {
                throw new Error('Unauthenticated!');
            }

            try {
                const notifications = await Notification.find({ user: userId })
                    .sort({ date: -1 })
                    .populate('order')
                    .populate('user', 'username profile_picture')
                    .populate({
                        path: 'message',
                        populate: {
                            path: 'sender',
                            select: 'username profile_picture',
                        },
                    });

                return notifications.map(notification => ({
                    ...notification._doc,
                    id: notification.id,
                }));
            } catch (err) {
                throw err;
            }
        },
    },
    Mutation: {
        markNotificationRead: async (_parent, { notificationId }, context) => {
            if (!context.isAuth) {
                throw new Error('Unauthenticated!');
            }
            try {
                const notification = await Notification.findById(notificationId);
                if (!notification) {
                    throw new Error('Notification not found');
                }
                if (notification.user.toString() !== context.userId.toString()) {
                    throw new Error('Not authorized');
                }
                notification.read = true;
                await notification.save();
                const populated = await Notification.findById(notificationId).populate('order').populate({
                    path: 'message',
                    populate: {
                        path: 'sender',
                        select: 'username profile_picture',
                    },
                });
                return {
                    ...populated._doc,
                    id: populated.id,
                };
            } catch (err) {
                throw err;
            }
        }
    }
};

// Attach Subscription separately to avoid missing export if schema expects it
NotificationsResolver.Subscription = {
    notificationSent: {
        subscribe: withFilter(
            (parent, args, context) => {
                if (!context || !context.pubsub) {
                    throw new Error('PubSub not available');
                }
                return context.pubsub.asyncIterator('NOTIFICATION_SENT');
            },
            (payload, variables) => {
                const userId = payload.notificationSent.user ? String(payload.notificationSent.user._id || payload.notificationSent.user) : null;
                return userId === variables.userId;
            }
        )
    }
};

export default NotificationsResolver;


