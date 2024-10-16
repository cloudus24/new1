const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentMethod: {
        type: String,
        enum: ["cash", "online", "card"], 
        default: "online"
    },
    paymentId: String,
    amount: Number,
    currency: String,
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Payment', paymentSchema);