import Order from '../../models/order.js';
import Conversation from '../../models/conversation.js';
import Transaction from '../../models/transaction.js';
import Service from '../../models/service.js';
import User from '../../models/user.js';

const OrdersResolver = {
    Query: {
        ordersByClientId: async (_parent, { userId }, context) => {
            if (!context.isAuth || context.userId !== userId) {
                throw new Error('Unauthenticated!');
            }
            try {
                const orders = await Order.find({ client: userId })
                    .populate('freelancer', 'username profile_picture')
                    .populate('service', 'title')
                    .populate('transaction')
                    .sort({ date: -1 });
                return orders.map(order => {
                    return { ...order._doc, _id: order._id };
                });
            } catch (err) {
                throw err;
            }
        },
        ordersByFreelancerId: async (_parent, { userId }, context) => {
            if (!context.isAuth || context.userId !== userId) {
                throw new Error('Unauthenticated!');
            }
            try {
                const orders = await Order.find({ freelancer: userId })
                    .populate('client', 'username profile_picture')
                    .populate('service', 'title')
                    .populate('transaction')
                    .sort({ date: -1 });
                return orders.map(order => {
                    return { ...order._doc, _id: order._id };
                });
            } catch (err) {
                throw err;
            }
        },
        orderById: async (_parent, { orderId }, context) => {
            if (!context.isAuth) {
                throw new Error('Unauthenticated!');
            }
            try {
                const order = await Order.findById(orderId)
                    .populate('client', 'username profile_picture')
                    .populate('freelancer', 'username profile_picture')
                    .populate('service', 'title description images rating')
                    .populate('conversation', 'messages')
                    .populate('transaction');
                
                // Check if user is authorized to view this order
                if (context.userId !== order.client._id.toString() && context.userId !== order.freelancer._id.toString()) {
                    throw new Error('Unauthorized to view this order!');
                }
                
                return { ...order._doc, _id: order._id };
            } catch (err) {
                throw err;
            }
        },
        transactionsByOrderId: async (_parent, { orderId }, context) => {
            if (!context.isAuth) {
                throw new Error('Unauthenticated!');
            }
            try {
                const order = await Order.findById(orderId);
                if (!order) {
                    throw new Error('Order not found!');
                }
                
                // Verify user is authorized
                if (context.userId !== order.client.toString() && context.userId !== order.freelancer.toString()) {
                    throw new Error('Unauthorized!');
                }
                
                const transactions = await Transaction.find({ order: orderId })
                    .populate('client', 'username')
                    .populate('freelancer', 'username')
                    .sort({ date: -1 });
                
                return transactions.map(transaction => {
                    return { ...transaction._doc, _id: transaction._id };
                });
            } catch (err) {
                throw err;
            }
        },
        transactionsByUserId: async (_parent, { userId }, context) => {
            if (!context.isAuth || context.userId !== userId) {
                throw new Error('Unauthenticated!');
            }
            try {
                const transactions = await Transaction.find({
                    $or: [
                        { client: userId },
                        { freelancer: userId }
                    ]
                })
                    .populate('order', 'price status')
                    .populate('client', 'username')
                    .populate('freelancer', 'username')
                    .sort({ date: -1 });
                
                return transactions.map(transaction => {
                    return { ...transaction._doc, _id: transaction._id };
                });
            } catch (err) {
                throw err;
            }
        }
    },
    Mutation: {
        createOrder: async (_parent, { order }, context) => {
            if (!context.isAuth) {
                throw new Error('Unauthenticated!');
            }
            
            // Verify that the client making the request matches the order client
            if (context.userId !== order.client) {
                throw new Error('Unauthorized! You can only create orders for yourself.');
            }
            
            try {
                // Verify service exists and get freelancer
                const service = await Service.findById(order.service);
                if (!service) {
                    throw new Error('Service not found!');
                }
                
                // Verify freelancer matches service owner
                if (service.freelancer.toString() !== order.freelancer) {
                    throw new Error('Freelancer does not match service owner!');
                }
                
                // Create the order
                const newOrder = new Order({
                    service: order.service,
                    client: order.client,
                    freelancer: order.freelancer,
                    status: 'PENDING',
                    date: new Date().toJSON().slice(0, 10),
                    deadline: order.deadline,
                    price: order.price,
                    description: order.description || '',
                });
                const savedOrder = await newOrder.save();

                // Create a pending transaction record
                const transaction = new Transaction({
                    order: savedOrder._id,
                    client: order.client,
                    freelancer: order.freelancer,
                    amount: order.price,
                    type: 'PAYMENT',
                    status: 'PENDING',
                    date: new Date().toJSON().slice(0, 10),
                    description: `Payment for order ${savedOrder._id}`,
                });
                const savedTransaction = await transaction.save();

                // Link transaction to order
                savedOrder.transaction = savedTransaction._id;
                await savedOrder.save();

                // Create conversation
                const newConversation = new Conversation({
                    users: [order.client, order.freelancer],
                    order: savedOrder._id,
                    messages: []
                });
                const savedConversation = await newConversation.save();

                // Link conversation to order
                savedOrder.conversation = savedConversation._id;
                await savedOrder.save();

                // Update service orders array
                service.orders.push(savedOrder._id);
                await service.save();

                // Update client orders array
                const client = await User.findById(order.client);
                if (client) {
                    client.orders.push(savedOrder._id);
                    await client.save();
                }

                // Update freelancer orders array
                const freelancer = await User.findById(order.freelancer);
                if (freelancer) {
                    freelancer.orders.push(savedOrder._id);
                    await freelancer.save();
                }

                return { ...savedOrder._doc, _id: savedOrder._id };
            } catch (err) {
                throw err;
            }
        },
        updateOrderStatus: async (_parent, { orderId, status }, context) => {
            if (!context.isAuth) {
                throw new Error('Unauthenticated!');
            }
            try {
                const order = await Order.findById(orderId)
                    .populate('client')
                    .populate('freelancer')
                    .populate('transaction');

                if (!order) {
                    throw new Error('Order not found!');
                }

                // Verify user is authorized
                const clientId = order.client._id ? order.client._id.toString() : order.client.toString();
                const freelancerId = order.freelancer._id ? order.freelancer._id.toString() : order.freelancer.toString();
                const isClient = context.userId === clientId;
                const isFreelancer = context.userId === freelancerId;
                
                if (!isClient && !isFreelancer) {
                    throw new Error('Unauthorized!');
                }

                const oldStatus = order.status;
                order.status = status;
                
                // Handle payment when order is closed (completed and paid)
                if (status === 'CLOSED' && oldStatus !== 'CLOSED') {
                    // Update transaction status
                    if (order.transaction) {
                        const transaction = await Transaction.findById(order.transaction);
                        if (transaction && transaction.status === 'PENDING') {
                            transaction.status = 'COMPLETED';
                            transaction.date = new Date().toJSON().slice(0, 10);
                            await transaction.save();

                            // Update client spending
                            const clientId = order.client._id ? order.client._id : order.client;
                            const client = await User.findById(clientId);
                            if (client) {
                                client.spending = (client.spending || 0) + order.price;
                                await client.save();
                            }

                            // Update freelancer earnings
                            const freelancerId = order.freelancer._id ? order.freelancer._id : order.freelancer;
                            const freelancer = await User.findById(freelancerId);
                            if (freelancer) {
                                freelancer.earnings = (freelancer.earnings || 0) + order.price;
                                freelancer.balance = (freelancer.balance || 0) + order.price;
                                await freelancer.save();
                            }
                        }
                    }
                }

                // Handle refunds for cancelled/declined orders
                if ((status === 'CANCELLED' || status === 'DECLINED') && oldStatus === 'CLOSED') {
                    if (order.transaction) {
                        const transaction = await Transaction.findById(order.transaction);
                        if (transaction && transaction.status === 'COMPLETED') {
                            // Create refund transaction
                            const refundClientId = order.client._id ? order.client._id : order.client;
                            const refundFreelancerId = order.freelancer._id ? order.freelancer._id : order.freelancer;
                            const refundTransaction = new Transaction({
                                order: order._id,
                                client: refundClientId,
                                freelancer: refundFreelancerId,
                                amount: order.price,
                                type: 'REFUND',
                                status: 'COMPLETED',
                                date: new Date().toJSON().slice(0, 10),
                                description: `Refund for cancelled order ${order._id}`,
                            });
                            await refundTransaction.save();

                            // Update original transaction
                            transaction.status = 'REFUNDED';
                            await transaction.save();

                            // Reverse client spending
                            const clientId = order.client._id ? order.client._id : order.client;
                            const client = await User.findById(clientId);
                            if (client) {
                                client.spending = Math.max(0, (client.spending || 0) - order.price);
                                await client.save();
                            }

                            // Reverse freelancer earnings
                            const freelancerId = order.freelancer._id ? order.freelancer._id : order.freelancer;
                            const freelancer = await User.findById(freelancerId);
                            if (freelancer) {
                                freelancer.earnings = Math.max(0, (freelancer.earnings || 0) - order.price);
                                freelancer.balance = Math.max(0, (freelancer.balance || 0) - order.price);
                                await freelancer.save();
                            }
                        }
                    }
                }

                const result = await order.save();
                return { ...result._doc, _id: result._id };
            } catch (err) {
                throw err;
            }
        }
    }
};

export default OrdersResolver;