import Order from '../../models/order.js';
import Transaction from '../../models/transaction.js';
import User from '../../models/user.js';
import Notification from '../../models/notification.js';

/**
 * Simulated Payment Gateway
 * This simulates a payment gateway like Stripe/Razorpay
 * In production, replace with actual payment gateway API calls
 */
class PaymentGateway {
  constructor() {
    this.paymentIntents = new Map(); // In-memory store for demo
  }

  async createPaymentIntent(amount, currency = 'USD', metadata = {}) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const intentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentIntent = {
      id: intentId,
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      status: 'requires_payment_method',
      metadata,
      created: Date.now(),
    };
    
    this.paymentIntents.set(intentId, paymentIntent);
    return paymentIntent;
  }

  async confirmPayment(intentId, paymentMethod) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const intent = this.paymentIntents.get(intentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }

    // Simulate payment processing
    // In production, this would call the actual payment gateway
    if (this.validatePaymentMethod(paymentMethod)) {
      intent.status = 'succeeded';
      intent.payment_method = paymentMethod;
      this.paymentIntents.set(intentId, intent);
      return {
        id: `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: intent.amount,
        payment_intent: intentId,
      };
    } else {
      throw new Error('Payment method validation failed');
    }
  }

  validatePaymentMethod(paymentMethod) {
    // Basic validation - in production, use actual payment gateway validation
    if (paymentMethod.type === 'card') {
      // Simulate card validation
      const cardNumber = paymentMethod.card_number?.replace(/\s/g, '');
      if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
        return false;
      }
      // Luhn algorithm check (simplified)
      return this.luhnCheck(cardNumber);
    }
    return true;
  }

  luhnCheck(cardNumber) {
    let sum = 0;
    let isEven = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  async releasePayment(intentId) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const intent = this.paymentIntents.get(intentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }
    if (intent.status !== 'succeeded') {
      throw new Error('Payment not completed');
    }
    // In production, this would transfer funds to freelancer
    return {
      transfer_id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'released',
      amount: intent.amount,
    };
  }

  async refundPayment(intentId, amount = null) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const intent = this.paymentIntents.get(intentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }
    const refundAmount = amount || intent.amount;
    // In production, this would process refund through payment gateway
    return {
      refund_id: `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'succeeded',
      amount: refundAmount,
    };
  }
}

const paymentGateway = new PaymentGateway();

const PaymentsResolver = {
  Mutation: {
    initiatePayment: async (_parent, { orderId, paymentMethod }, context) => {
      if (!context.isAuth) {
        throw new Error('Unauthenticated!');
      }

      try {
        const order = await Order.findById(orderId)
          .populate('client')
          .populate('freelancer')
          .populate('transaction');

        if (!order) {
          throw new Error('Order not found');
        }

        // Verify user is the client
        const clientId = order.client._id ? order.client._id.toString() : order.client.toString();
        if (context.userId !== clientId) {
          throw new Error('Only the client can initiate payment');
        }

        // Check if payment already exists
        if (order.transaction) {
          const existingTransaction = await Transaction.findById(order.transaction);
          if (existingTransaction && existingTransaction.escrow_status === 'HELD') {
            throw new Error('Payment already processed for this order');
          }
        }

        // Create payment intent
        const paymentIntent = await paymentGateway.createPaymentIntent(
          order.price,
          'USD',
          {
            orderId: order._id.toString(),
            clientId: clientId,
            freelancerId: order.freelancer._id.toString(),
          }
        );

        // Confirm payment
        const charge = await paymentGateway.confirmPayment(paymentIntent.id, paymentMethod);

        // Create or update transaction
        let transaction;
        if (order.transaction) {
          transaction = await Transaction.findById(order.transaction);
          transaction.status = 'ESCROWED';
          transaction.escrow_status = 'HELD';
          transaction.payment_intent_id = paymentIntent.id;
          transaction.transaction_id = charge.id;
          transaction.payment_method = paymentMethod.type;
          await transaction.save();
        } else {
          transaction = new Transaction({
            order: order._id,
            client: order.client._id || order.client,
            freelancer: order.freelancer._id || order.freelancer,
            amount: order.price,
            type: 'PAYMENT',
            status: 'ESCROWED',
            escrow_status: 'HELD',
            date: new Date().toJSON().slice(0, 10),
            description: `Escrow payment for order ${order._id}`,
            payment_intent_id: paymentIntent.id,
            transaction_id: charge.id,
            payment_method: paymentMethod.type,
          });
          await transaction.save();

          // Link transaction to order
          order.transaction = transaction._id;
          await order.save();
        }

        // Update order status if it's still PENDING
        if (order.status === 'PENDING') {
          order.status = 'IN_PROGRESS';
          await order.save();
        }

        // Create notification for freelancer
        try {
          const notif = new Notification({
            user: order.freelancer._id || order.freelancer,
            order: order._id,
            content: `Payment received for order #${order._id.slice(-6)}. Funds held in escrow.`,
            read: false,
          });
          const savedNotif = await notif.save();
          const populated = await Notification.findById(savedNotif._id)
            .populate('order')
            .populate('user', 'username profile_picture');
          if (context && context.pubsub) {
            context.pubsub.publish('NOTIFICATION_SENT', { notificationSent: populated });
          }
        } catch (e) {
          console.log('Failed to create notification', e);
        }

        // Publish order update
        const populatedOrder = await Order.findById(order._id)
          .populate('client', 'username profile_picture')
          .populate('freelancer', 'username profile_picture')
          .populate('service', 'title')
          .populate('transaction');

        if (context && context.pubsub) {
          context.pubsub.publish(`ORDER_UPDATED_${order._id}`, { orderUpdated: populatedOrder });
          context.pubsub.publish('ORDER_UPDATED_GLOBAL', { orderUpdatedGlobal: populatedOrder });
        }

        return {
          success: true,
          message: 'Payment processed successfully. Funds held in escrow.',
          transaction,
          order: populatedOrder,
          payment_intent_id: paymentIntent.id,
        };
      } catch (err) {
        return {
          success: false,
          message: err.message || 'Payment processing failed',
          transaction: null,
          order: null,
          payment_intent_id: null,
        };
      }
    },

    releaseEscrow: async (_parent, { orderId }, context) => {
      if (!context.isAuth) {
        throw new Error('Unauthenticated!');
      }

      try {
        const order = await Order.findById(orderId)
          .populate('client')
          .populate('freelancer')
          .populate('transaction');

        if (!order) {
          throw new Error('Order not found');
        }

        // Verify user is the client
        const clientId = order.client._id ? order.client._id.toString() : order.client.toString();
        if (context.userId !== clientId) {
          throw new Error('Only the client can release escrow');
        }

        // Verify order is completed
        if (order.status !== 'COMPLETED') {
          throw new Error('Order must be completed before releasing escrow');
        }

        // Verify transaction exists and is in escrow
        if (!order.transaction) {
          throw new Error('No transaction found for this order');
        }

        const transaction = await Transaction.findById(order.transaction);
        if (!transaction) {
          throw new Error('Transaction not found');
        }

        if (transaction.escrow_status !== 'HELD') {
          throw new Error('Funds are not in escrow');
        }

        // Release payment
        const release = await paymentGateway.releasePayment(transaction.payment_intent_id);

        // Update transaction
        transaction.status = 'RELEASED';
        transaction.escrow_status = 'RELEASED';
        transaction.escrow_release_date = new Date().toJSON().slice(0, 10);
        await transaction.save();

        // Update order status
        order.status = 'CLOSED';
        await order.save();

        // Update freelancer earnings and balance
        const freelancerId = order.freelancer._id || order.freelancer;
        const freelancer = await User.findById(freelancerId);
        if (freelancer) {
          freelancer.earnings = (freelancer.earnings || 0) + order.price;
          freelancer.balance = (freelancer.balance || 0) + order.price;
          await freelancer.save();
        }

        // Update client spending
        const client = await User.findById(clientId);
        if (client) {
          client.spending = (client.spending || 0) + order.price;
          await client.save();
        }

        // Create notification for freelancer
        try {
          const notif = new Notification({
            user: freelancerId,
            order: order._id,
            content: `Escrow released for order #${order._id.slice(-6)}. $${order.price} has been transferred to your account.`,
            read: false,
          });
          const savedNotif = await notif.save();
          const populated = await Notification.findById(savedNotif._id)
            .populate('order')
            .populate('user', 'username profile_picture');
          if (context && context.pubsub) {
            context.pubsub.publish('NOTIFICATION_SENT', { notificationSent: populated });
          }
        } catch (e) {
          console.log('Failed to create notification', e);
        }

        // Publish order update
        const populatedOrder = await Order.findById(order._id)
          .populate('client', 'username profile_picture')
          .populate('freelancer', 'username profile_picture')
          .populate('service', 'title')
          .populate('transaction');

        if (context && context.pubsub) {
          context.pubsub.publish(`ORDER_UPDATED_${order._id}`, { orderUpdated: populatedOrder });
          context.pubsub.publish('ORDER_UPDATED_GLOBAL', { orderUpdatedGlobal: populatedOrder });
        }

        return {
          success: true,
          message: 'Escrow released successfully. Funds transferred to freelancer.',
          transaction,
          order: populatedOrder,
          payment_intent_id: transaction.payment_intent_id,
        };
      } catch (err) {
        return {
          success: false,
          message: err.message || 'Failed to release escrow',
          transaction: null,
          order: null,
          payment_intent_id: null,
        };
      }
    },

    refundEscrow: async (_parent, { orderId }, context) => {
      if (!context.isAuth) {
        throw new Error('Unauthenticated!');
      }

      try {
        const order = await Order.findById(orderId)
          .populate('client')
          .populate('freelancer')
          .populate('transaction');

        if (!order) {
          throw new Error('Order not found');
        }

        // Verify user is authorized (client or freelancer)
        const clientId = order.client._id ? order.client._id.toString() : order.client.toString();
        const freelancerId = order.freelancer._id ? order.freelancer._id.toString() : order.freelancer.toString();
        const isClient = context.userId === clientId;
        const isFreelancer = context.userId === freelancerId;

        if (!isClient && !isFreelancer) {
          throw new Error('Unauthorized');
        }

        // Verify transaction exists and is in escrow
        if (!order.transaction) {
          throw new Error('No transaction found for this order');
        }

        const transaction = await Transaction.findById(order.transaction);
        if (!transaction) {
          throw new Error('Transaction not found');
        }

        if (transaction.escrow_status !== 'HELD') {
          throw new Error('Funds are not in escrow');
        }

        // Process refund
        const refund = await paymentGateway.refundPayment(transaction.payment_intent_id);

        // Update transaction
        transaction.status = 'REFUNDED';
        transaction.escrow_status = 'REFUNDED';
        await transaction.save();

        // Update order status
        if (order.status !== 'CANCELLED' && order.status !== 'DECLINED') {
          order.status = 'CANCELLED';
          await order.save();
        }

        // Create notification
        try {
          const notif = new Notification({
            user: isClient ? freelancerId : clientId,
            order: order._id,
            content: `Escrow refunded for order #${order._id.slice(-6)}. $${order.price} has been refunded.`,
            read: false,
          });
          const savedNotif = await notif.save();
          const populated = await Notification.findById(savedNotif._id)
            .populate('order')
            .populate('user', 'username profile_picture');
          if (context && context.pubsub) {
            context.pubsub.publish('NOTIFICATION_SENT', { notificationSent: populated });
          }
        } catch (e) {
          console.log('Failed to create notification', e);
        }

        // Publish order update
        const populatedOrder = await Order.findById(order._id)
          .populate('client', 'username profile_picture')
          .populate('freelancer', 'username profile_picture')
          .populate('service', 'title')
          .populate('transaction');

        if (context && context.pubsub) {
          context.pubsub.publish(`ORDER_UPDATED_${order._id}`, { orderUpdated: populatedOrder });
          context.pubsub.publish('ORDER_UPDATED_GLOBAL', { orderUpdatedGlobal: populatedOrder });
        }

        return {
          success: true,
          message: 'Escrow refunded successfully. Funds returned to client.',
          transaction,
          order: populatedOrder,
          payment_intent_id: transaction.payment_intent_id,
        };
      } catch (err) {
        return {
          success: false,
          message: err.message || 'Failed to refund escrow',
          transaction: null,
          order: null,
          payment_intent_id: null,
        };
      }
    },
  },
};

export default PaymentsResolver;

