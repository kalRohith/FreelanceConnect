import 'dotenv/config';

import Conversation from '../../models/conversation.js';
import Message from '../../models/message.js';
import User from '../../models/user.js';
import Order from '../../models/order.js';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// --- HELPER: Local Risk Engine (Fallback when AI is offline) ---
const calculateManualRisk = (text) => {
  let score = 0.2; // Default low risk
  const highRiskKeywords = [/scam/i, /police/i, /fraud/i, /stolen/i, /lawyer/i, /sue/i];
  const medRiskKeywords = [/refund/i, /late/i, /worst/i, /lying/i, /ignore/i, /money/i];

  highRiskKeywords.forEach(regex => { if (regex.test(text)) score += 0.4; });
  medRiskKeywords.forEach(regex => { if (regex.test(text)) score += 0.15; });

  return Math.min(score, 1.0); // Cap at 1.0
};

// --- HELPER: Extract JSON safely ---
const extractJSON = (str) => {
  const match = str.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

const ChatResolver = {
  Subscription: {
    messageSent: {
      subscribe: (_parent, { conversationId }) => {
        return pubsub.asyncIterator([conversationId]);
      },
    },
  },

  Query: {
    conversationByOrderId: async (_parent, { orderId }, context) => {
      if (!context.isAuth) throw new Error("Unauthenticated");

      const conversation = await Conversation.findOne({ order: orderId })
        .populate("messages")
        .populate("users", "username profile_picture");

      if (!conversation) throw new Error("Conversation not found");

      const allowed = conversation.users.some(
        (u) => u._id.toString() === context.userId
      );

      if (!allowed) throw new Error("Unauthorized");

      return { ...conversation._doc, _id: conversation._id };
    },
  },

  Mutation: {
    sendMessage: async (_parent, { message }, context) => {
      if (!context.isAuth) throw new Error("Unauthenticated");

      const newMessage = new Message({
        sender: message.sender,
        body: message.body,
        date: Date.now(),
        conversation: message.conversation,
      });

      const savedMessage = await newMessage.save();

      const conversation = await Conversation.findById(
        message.conversation
      ).populate("users");

      if (!conversation) throw new Error("Conversation not found");

      const allowed = conversation.users.some(
        (u) => u._id.toString() === context.userId
      );

      if (!allowed) throw new Error("Unauthorized");

      conversation.messages.push(savedMessage._id);
      await conversation.save();

      pubsub.publish(message.conversation, {
        messageSent: { ...savedMessage._doc, _id: savedMessage._id },
      });

      return { ...savedMessage._doc, _id: savedMessage._id };
    },

    askDisputeBot: async (_parent, { orderId, question }, context) => {
      // 1. Debugging Logs (Check your terminal for these!)
      console.log("--- DISPUTE BOT TRIGGERED ---");
      console.log("Context User:", context.userId ? "Auth OK" : "No Auth");
      console.log("API Key Status:", process.env.GEMINI_API_KEY ? "✅ Key Found" : "❌ Key Missing/Undefined");

      if (!context.isAuth) throw new Error("Unauthenticated");

      // 2. Fetch Data
      const conversation = await Conversation.findOne({ order: orderId })
        .populate("messages")
        .populate("users");

      const order = await Order.findById(orderId);
      if (!conversation || !order) throw new Error("Order not found");

      const recentMessages = conversation.messages
        .slice(-10)
        .map((m) => `${m.sender}: ${m.body}`)
        .join("\n");

      // Default strings
      let reply = "I am reviewing the case details.";
      let riskScore = 0.5;

      // 3. AI Logic
      if (process.env.GEMINI_API_KEY) {
        console.log("Attempting to contact Gemini AI...");
        try {
          const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

          const systemPrompt = `You are a neutral Dispute Resolution Assistant.
          Analyze the context and the user's question.
          Return a JSON object with:
          - "reply": Short, professional advice.
          - "riskScore": A number between 0.0 and 1.0.
          DO NOT use Markdown.`;

          const prompt = `Context:\n${recentMessages}\n\nUser Question: ${question}`;

          const resp = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: systemPrompt + "\n" + prompt }
                  ]
                }
              ]
            })
          });

          const data = await resp.json();

          if (!resp.ok || data.error) {
            console.error("Gemini API Error:", data.error || data);
            throw new Error("API_ERROR");
          }

          const rawText =
            data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!rawText) throw new Error("EMPTY_RESPONSE");

          const jsonString = extractJSON(rawText);
          const aiResult = JSON.parse(jsonString);

          reply = aiResult.reply;
          riskScore = Number(aiResult.riskScore) || 0.5;

          console.log("✅ AI Success. Risk Score:", riskScore);

        } catch (err) {
          console.warn("⚠️ AI Failed, using manual fallback. Reason:", err.message);

          // MANUAL FALLBACK
          riskScore = calculateManualRisk(recentMessages + " " + question);
          reply = riskScore > 0.7
            ? "I detect high tension in this dispute. I have flagged this for immediate human review."
            : "I am currently running in offline mode. Please contact support if you need urgent help.";
        }
      } else {
        console.error("❌ SKIPPING AI: No API Key found in process.env");
      }

      // 4. Save and Update (Rest of the code is same)
      order.disputeRisk = riskScore;
      if (riskScore > 0.7) {
        order.isFlaggedForReview = true;
        reply += "\n\n[SYSTEM] 🛡️ Case Flagged for Human Review.";
      }
      await order.save();

      /* ============ SAVE BOT MESSAGE ============ */
      let botUser = await User.findOne({ email: "dispute-bot@local" });
      if (!botUser) {
        botUser = new User({
          email: "dispute-bot@local",
          username: "Dispute Bot",
          is_active: true,
          // This generates a clean, professional "DB" avatar automatically
          profile_picture: "https://ui-avatars.com/api/?name=Dispute+Bot&background=0D8ABC&color=fff"
        });
        await botUser.save();
      }

      let botMessage = new Message({
        sender: botUser._id,
        body: reply,
        date: new Date(),
        conversation: conversation._id,
      });

      await botMessage.save();
      conversation.messages.push(botMessage._id);
      await conversation.save();

      const populatedBotMsg = await botMessage.populate("sender", "username profile_picture");

      pubsub.publish(conversation._id.toString(), {
        messageSent: populatedBotMsg,
      });

      return populatedBotMsg;
    },
  },
};

export default ChatResolver;