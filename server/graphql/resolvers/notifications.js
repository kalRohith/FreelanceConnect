import Notification from '../../models/notification.js';
import User from '../../models/user.js';

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
};

export default NotificationsResolver;


