import Conversation from '../../models/conversation.js';
import Message from '../../models/message.js';
import Notification from '../../models/notification.js';
import User from '../../models/user.js';
import Order from '../../models/order.js';
import Service from '../../models/service.js';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

const ChatResolver = {
    Subscription: {
        messageSent: {
            subscribe: (_parent, { conversationId }) => {
                return pubsub.asyncIterator([conversationId]);
            }
        }
    },
    Query: {
        conversationByOrderId: async (_parent, { orderId }, context) => {
            if (!context.isAuth) {
                throw new Error("Unauthenticated");
            }
            try {
                const conversation = await Conversation.findOne({ order: orderId })
                    .populate('messages')
                    .populate('users', 'username profile_picture')

                if (context.userId !== conversation.users[0]._id.toString() && context.userId !== conversation.users[1]._id.toString()) {
                    throw new Error("Unauthorized");
                }

                return { ...conversation._doc, _id: conversation._id };
            } catch (err) {
                throw err;
            }
        }
    },
    Mutation: {
        sendMessage: async (_parent, { message }, context) => {
            if (!context.isAuth) {
                throw new Error("Unauthenticated");
            }
            try {
                const newMessage = new Message({
                    sender: message.sender,
                    body: message.body,
                    date: Date.now(),
                    conversation: message.conversation
                });
                const result = await newMessage.save();

                const conversation = await Conversation.findById(message.conversation)
                    .populate('users');

                if (
                    !conversation ||
                    conversation.users.length < 2 ||
                    (context.userId !== conversation.users[0]._id.toString() &&
                        context.userId !== conversation.users[1]._id.toString())
                ) {
                    throw new Error("Unauthorized");
                }

                conversation.messages.push(result._id);
                await conversation.save();

                // Determine recipient (other user in the conversation)
                const recipient = conversation.users.find(
                    (u) => u._id.toString() !== context.userId.toString()
                );

                if (recipient && conversation.order) {
                    // Get sender info
                    const sender = await User.findById(context.userId);
                    
                    // Get order and service info
                    const order = await Order.findById(conversation.order).populate('service', 'title');
                    
                    // Create notification content with sender username and service name
                    const senderName = sender?.username || 'Someone';
                    const serviceName = order?.service?.title || 'your order';
                    const notificationContent = `New message from ${senderName} for order ${serviceName}`;
                    
                    // Create a notification for the recipient linked to this message and order
                    const notification = new Notification({
                        user: recipient._id,
                        order: conversation.order,
                        message: result._id,
                        content: notificationContent,
                    });
                    const savedNotification = await notification.save();

                    // Attach notification to the user document
                    const recipientUser = await User.findById(recipient._id);
                    if (recipientUser) {
                        recipientUser.notifications.push(savedNotification._id);
                        await recipientUser.save();
                    }
                }

                // Publish the message to subscribers
                pubsub.publish(message.conversation, {
                    messageSent: { ...result._doc, _id: result._id }
                });

                return { ...result._doc, _id: result._id };
            } catch (err) {
                throw err;
            }
        }
    }
};

export default ChatResolver;