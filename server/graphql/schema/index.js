import { gql } from 'apollo-server-express';

const Schema = gql`

type Query {
  login(email: String!, password: String!): AuthData!,
  user(userId: ID!): User!,
  getUserByToken(token: String!): User!,

  reviewsByUserId(userId: ID!): [Review]!,
  reviewsByServiceId(serviceId: ID!): [Review]!,
  reviewsByOrderId(orderId: ID!): [Review]!,

  services: [Service]!,
  servicesByUserId(userId: ID!): [Service]!,
  servicesByCategory(category: String!): [Service]!,
  servicesByCategoryUrlName(categoryUrlName: String!): [Service]!,
  service(serviceId: ID!): Service!,
  servicesBySearchQuery(searchQuery: String!): [Service]!,

  categories: [Category]!,

  ordersByClientId(userId: ID!): [Order]!,
  ordersByFreelancerId(userId: ID!): [Order]!,
  orderById(orderId: ID!): Order!,
  transactionsByOrderId(orderId: ID!): [Transaction]!,
  transactionsByUserId(userId: ID!): [Transaction]!,

  conversationByOrderId(orderId: ID!): Conversation!,
  notificationsByUserId(userId: ID!): [Notification]!,
},

type Mutation {
  createUser(user: UserInput): User,
  updateUser(userId: ID!, user: UpdateUserInput!): User,
  createService(service: ServiceInput): Service,
  updateService(serviceId: ID!, service: UpdateServiceInput!, newImages: [Upload!]): Service,
  deleteService(serviceId: ID!): Boolean!,
  createCategory(category: CategoryInput): Category,
  createReview(review: ReviewInput): Review,
  uploadPhoto(photo: String): String,
  singleUpload(file: Upload!): File!,
  multipleUpload(files: [Upload!]!): [File!]!,
  createOrder(order: OrderInput): Order,
  sendMessage(message: MessageInput): Message,
  askDisputeBot(orderId: ID!, question: String!): Message,
  payOrder(orderId: ID!): Order,
  updateOrderStatus(orderId: ID!, status: String!): Order,
  markNotificationRead(notificationId: ID!): Notification,
  initiatePayment(orderId: ID!, paymentMethod: PaymentMethodInput!): PaymentResult!,
  releaseEscrow(orderId: ID!): PaymentResult!,
  refundEscrow(orderId: ID!): PaymentResult!,
  createCheckoutSession(serviceId: ID!): String
},

type Subscription {
  messageSent(conversationId: ID!): Message,
  notificationSent(userId: ID!): Notification,
  orderUpdated(orderId: ID!): Order,
  orderUpdatedGlobal: Order,
},

type CheckoutSessionResult {
  url: String!
}
 

type File {
    filename: String!,
    mimetype: String!,
    encoding: String!,
    cloudinaryUrl: String!,
},

scalar Upload,

type AuthData {
  userId: ID!,
  token: String!,
  tokenExpiration: Int!,
},

type Review {
  _id: ID!,
  reviewer: User!,
  reviewee: User!,
  rating: Float!,
  content: String!,
  date: String!,
  order: Order,
  service: Service,
},

input ReviewInput {
  reviewee: ID!,
  rating: Float!,
  content: String!,
  order: ID,
  service: ID,
},

type Notification {
  id: ID!,
  user: User!,
  read: Boolean!,
  content: String!,
  date: String!,
  message: Message,
  order: Order,
},

type Conversation {
  _id: ID!,
  users: [User]!,
  messages: [Message]!,
},

type Message {
  _id: ID!,
  sender: User!,
  body: String!,
  date: String!,
  conversation: ID!,
},

input MessageInput {
  sender: ID!,
  body: String!,
  conversation: ID!,
},

type User {
  _id: ID!,
  username: String!,
  email: String!,
  password: String!,
  full_name: String!,
  bio: String,
  profile_picture: String,
  joined_date: String!,
  last_login: String!,
  is_active: Boolean!,
  freelance_rating: Float!,
  client_rating: Float!,
  earnings: Float!,
  balance: Float!,
  spending: Float!,
  services: [Service]!,
  reviews: [Review]!,
  notifications: [Notification]!,
  orders: [Order]!,
  conversations: [Conversation]!,
},

input UserInput {
  username: String!,
  email: String!,
  password: String!,
  full_name: String!,
  bio: String,
  profile_picture: String,
  # joined_date: String!,
  # last_login: String!,
  # is_active: Boolean!,
  # rating: Float!
},

input UpdateUserInput {
  username: String,
  full_name: String,
  bio: String,
  profile_picture: String,
}

type Service {
  _id: ID!,
  title: String!,
  description: String!,
  category: String!,
  price: Float!,
  rating: Float!,
  freelancer: User!,
  reviews: [Review]!,
  orders: [Order]!,
  images: [String]!,
  recommendationScore: Float!,
},

input ServiceInput {
  title: String!,
  description: String!,
  category: ID!,
  price: Float!,
  images: [String]!,
},

input UpdateServiceInput {
  title: String!,
  description: String!,
  category: ID!,
  price: Float!,
  images: [String]!,
},

type Category{
  _id: ID!,
  name: String!,
  description: String!,
  url_name: String!,
  services: [Service]!,
}

input CategoryInput{
  name: String!,
  description: String!,
},

enum OrderStatus {
# TODO: make a state diagram for the order status to make sure it makes sense
  # order has been created but not yet accepted by the freelancer
  PENDING,
  # order has been accepted by the freelancer but not yet paid for by the client
  IN_PROGRESS,
  # order has been completed by the freelancer and accepted by the client
  COMPLETED,
  # order has been completed by the freelancer and paid by the client
  CLOSED,
  # order has been cancelled by the client
  CANCELLED,
  # order has been cancelled by the freelancer
  DECLINED,
},

type Order {
  _id: ID!,
  service: Service!,
  freelancer: User!,
  client: User!,
  date: String!,
  price: Float!,
  deadline: String!,
  status: OrderStatus!,
  freelancer_review: Review,
  client_review: Review,
  conversation: Conversation,
  description: String,
  transaction: Transaction,
  chat: Chat,
},

type Transaction {
  _id: ID!,
  order: Order!,
  client: User!,
  freelancer: User!,
  amount: Float!,
  type: String!,
  status: String!,
  escrow_status: String,
  date: String!,
  description: String,
  payment_method: String,
  transaction_id: String,
  payment_intent_id: String,
  escrow_release_date: String,
},

type PaymentResult {
  success: Boolean!,
  message: String!,
  transaction: Transaction,
  order: Order,
  payment_intent_id: String,
},

input PaymentMethodInput {
  type: String!,
  card_number: String,
  card_expiry: String,
  card_cvv: String,
  cardholder_name: String,
},

input OrderInput {
  service: ID!,
  freelancer: ID!,
  client: ID!,
  price: Float!,
  description: String,
  deadline: String!,
},

type Chat{
  id: ID!,
  messages: [Message]!,
},

`
export default Schema;