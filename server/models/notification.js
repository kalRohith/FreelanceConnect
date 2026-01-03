import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
    },
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
    },
    content: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        default: () => new Date().toISOString(),
    },
    read: {
        type: Boolean,
        default: false,
    },
});

export default model('Notification', notificationSchema);