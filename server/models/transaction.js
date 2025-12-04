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
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    date: {
        type: String,
        required: true
    },
    description: String,
    payment_method: String,
    transaction_id: String // External payment gateway transaction ID if applicable
});

export default model('Transaction', transactionSchema);

