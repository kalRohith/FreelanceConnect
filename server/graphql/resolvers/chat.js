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
      if (!context.isAuth) throw new Error("Unauthenticated");

      const conversation = await Conversation.findOne({ order: orderId })
        .populate('messages')
        .populate('users', 'username profile_picture');

      if (!conversation) throw new Error("Conversation not found");

      const allowed = conversation.users.some(
        u => u._id.toString() === context.userId
      );
      if (!allowed) throw new Error("Unauthorized");

      return { ...conversation._doc, _id: conversation._id };
    }
  },

  Mutation: {
    sendMessage: async (_parent, { message }, context) => {
      if (!context.isAuth) throw new Error("Unauthenticated");

      const newMessage = new Message({
        sender: message.sender,
        body: message.body,
        date: Date.now(),
        conversation: message.conversation
      });

      const savedMessage = await newMessage.save();

      const conversation = await Conversation.findById(message.conversation)
        .populate('users');

      if (!conversation) throw new Error("Conversation not found");

      const allowed = conversation.users.some(
        u => u._id.toString() === context.userId
      );
      if (!allowed) throw new Error("Unauthorized");

      conversation.messages.push(savedMessage._id);
      await conversation.save();

      pubsub.publish(message.conversation, {
        messageSent: { ...savedMessage._doc, _id: savedMessage._id }
      });

      return { ...savedMessage._doc, _id: savedMessage._id };
    },

    askDisputeBot: async (_parent, { orderId, question }, context) => {
        console.log('Gemini key loaded:', !!process.env.GEMINI_API_KEY);

      if (!context.isAuth) throw new Error('Unauthenticated');

      const conversation = await Conversation.findOne({ order: orderId })
        .populate('messages')
        .populate('users');

      if (!conversation) throw new Error('Conversation not found');

      const isParticipant = conversation.users.some(
        u => u._id.toString() === context.userId
      );
      if (!isParticipant) throw new Error('Unauthorized');

      // Build recent context
      const recentMessages = conversation.messages
        .slice(-8)
        .map(m => m.body)
        .join('\n');

      let reply = '';

      /* ================= GEMINI AI ================= */
      if (process.env.GEMINI_API_KEY) {
        try {
          let fetchFn = global.fetch;
          if (!fetchFn) {
            fetchFn = (await import('node-fetch')).default;
          }

          const systemPrompt =
            `You are a Dispute Resolution Assistant for a freelancing platform.
Give short, practical advice. Be neutral and professional.`;

          const prompt =
            `${systemPrompt}\n\nUser question:\n${question}\n\nConversation context:\n${recentMessages}`;

          const resp = await fetchFn(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [{ text: prompt }]
                  }
                ],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 350
                }
              })
            }
          );

          const data = await resp.json();

            console.log('Gemini status:', resp.status);
            console.log('Gemini raw response:', JSON.stringify(data, null, 2));

            reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';


        } catch (err) {
          console.error('Gemini API failed, using fallback', err);
        }
      }

      /* ============ RULE-BASED FALLBACK ============ */
      if (!reply) {
        const text = (question + ' ' + recentMessages).toLowerCase();

        if (/refund|money back|return|chargeback/.test(text)) {
          reply =
            `It appears this is a refund-related issue.\n\nRecommended steps:
1) Clearly request a refund with reasons and evidence.
2) Allow 48–72 hours for response.
3) If unresolved, escalate to platform support with screenshots and order ID.`;
        } else if (/late|delay|deadline|delivery/.test(text)) {
          reply =
            `This seems to be a delivery delay issue.\n\nRecommended steps:
1) Ask for a revised delivery timeline.
2) Offer a short extension if acceptable.
3) If unmet, consider cancelling and requesting a refund.`;
        } else if (/quality|poor|revision|fix/.test(text)) {
          reply =
            `This appears to be a quality concern.\n\nRecommended steps:
1) Provide specific feedback.
2) Request revisions clearly.
3) Escalate to dispute if the issue persists.`;
        } else {
          reply =
            `Here’s a summary of the situation:\n${recentMessages.slice(-800)}\n\nSuggested next steps:
- Clarify expectations
- Share evidence
- Escalate if unresolved`;
        }
      }

      /* ============ SAVE BOT MESSAGE ============ */
      let botUser = await User.findOne({ email: 'dispute-bot@local' });
      if (!botUser) {
        botUser = new User({
          email: 'dispute-bot@local',
          username: 'Dispute Bot',
          password: 'bot',
          joined_date: new Date().toISOString(),
          is_active: true
        });
        await botUser.save();
      }

      let botMessage = new Message({
        sender: botUser._id,
        body: reply,
        date: Date.now(),
        conversation: conversation._id
      });

      botMessage = await botMessage.save();
      conversation.messages.push(botMessage._id);
      await conversation.save();

      botMessage = await botMessage.populate('sender', 'username profile_picture');

      pubsub.publish(conversation._id.toString(), {
        messageSent: { ...botMessage._doc, _id: botMessage._id }
      });

      return { ...botMessage._doc, _id: botMessage._id };
    }
  }
};

export default ChatResolver;
