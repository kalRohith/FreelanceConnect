import { Schema, model } from 'mongoose';

const transactionSchema = new Schema({
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    client: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    freelancer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['PAYMENT', 'REFUND', 'COMMISSION'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'ESCROWED', 'RELEASED'],
        default: 'PENDING'
    },
    escrow_status: {
        type: String,
        enum: ['PENDING', 'HELD', 'RELEASED', 'REFUNDED'],
        default: 'PENDING'
    },
    date: {
        type: String,
        required: true
    },
    description: String,
    payment_method: String,
    transaction_id: String, // External payment gateway transaction ID if applicable
    payment_intent_id: String, // Payment intent ID from payment gateway
    escrow_release_date: String // Date when escrow was released
});

export default model('Transaction', transactionSchema);

