const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Credit', 'Debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InvoiceRequest' // Can be used for tracking which invoice this relates to
    },
    balanceAfter: {
        type: Number // Snapshot of balance after this transaction
    }
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
