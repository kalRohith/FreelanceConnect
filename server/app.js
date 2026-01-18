import dotenv from 'dotenv';
dotenv.config();

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import express from 'express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import bodyParser from 'body-parser';
import cors from 'cors';
import typeDefs from './graphql/schema/index.js';
import resolvers from './graphql/resolvers/index.js';
import { connect } from 'mongoose';

import { verify } from 'jsonwebtoken';
import { graphqlUploadExpress } from 'graphql-upload';
import cookieParser from 'cookie-parser';
// payment webhook handlers removed

const pubsub = new PubSub();

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer({
  schema,
  context: async (ctx, msg, args) => {
    const connectionParams = ctx.connectionParams || {};
    const token = connectionParams.token;
    if (!token) return { pubsub };
    try {
      const decoded = verify(token, process.env.JWT_KEY);
      return { pubsub, userId: decoded.userId };
    } catch (err) {
      return { pubsub };
    }
  }
}, wsServer);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});




// MongoDB Connection
const mongoUser = process.env.MONGO_ATLAS_USER;
const mongoPassword = process.env.MONGO_ATLAS_PW;
const mongoDb = process.env.MONGO_ATLAS_DB;

if (!mongoUser || !mongoPassword || !mongoDb) {
  console.error('❌ MongoDB credentials are missing! Please check your .env file.');
  process.exit(1);
}

const mongoUri = `mongodb+srv://${mongoUser}:${encodeURIComponent(mongoPassword)}@freelanceconnect.nblezz6.mongodb.net/${mongoDb}?appName=FreelanceConnect&retryWrites=true&w=majority`;

connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log(`📊 Database: ${mongoDb}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:');
    console.error('Error details:', err.message);
    if (err.message.includes('authentication failed')) {
      console.error('💡 Tip: Check your MongoDB Atlas username and password in .env file');
      console.error('💡 Tip: Ensure your IP address is whitelisted in MongoDB Atlas Network Access');
    }
  });

const corsOptions = {
  origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
  credentials: true,
};

await server.start();

// payment webhook endpoints removed

app.use(
  '/graphql',
  cookieParser(),
  cors(corsOptions),
  graphqlUploadExpress({
    maxFileSize: 1000000, // 1 MB
    maxFiles: 20,
  }),
  bodyParser.json(),
  expressMiddleware(server, {
    context: ({ req }) => {
      const token = req.cookies.token; // Get the token value from the 'token' cookie

      if (!token) {
        req.isAuth = false;
        console.log('No token');
        return {
          isAuth: false,
        }
      }

      let decodedToken;
      try {
        decodedToken = verify(token, process.env.JWT_KEY);
      } catch (err) {
        req.isAuth = false;
        console.log('Invalid token');
        return {
          isAuth: false,
        }
      }

      if (!decodedToken) {
        req.isAuth = false;
        console.log('Invalid token');
        return {
          isAuth: false,
        }
      }

      console.log('Valid token');

      return {
        isAuth: true,
        userId: decodedToken.userId,
        pubsub,
      }
    } // Retrieve token from req.cookies
  }),
);

const PORT = 4000;

httpServer.listen(PORT, () => {
  console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});