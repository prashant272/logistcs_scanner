const InvoiceRequest = require('../models/InvoiceRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { sendNotification } = require('./notificationService');

/**
 * Automatically deducts pending invoice repayments from a newly recharged wallet amount.
 * @param {String} vendorId - ID of the vendor
 * @param {Number} rechargeAmount - Recharged amount
 * @param {String} paymentMethod - 'Gateway' or 'Bank Transfer'
 * @returns {Object} { clearedInvoices, remainingRecharge, totalDeducted }
 */
exports.processAutoDeductionOnRecharge = async (vendorId, rechargeAmount, paymentMethod = 'Recharge') => {
    try {
        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return { clearedInvoices: [], remainingRecharge: rechargeAmount, totalDeducted: 0, finalBalance: 0 };
        }

        // Find all pending invoices awaiting repayment, sorted by oldest timelineDate / createdAt
        const pendingInvoices = await InvoiceRequest.find({
            vendor: vendorId,
            status: { $in: ['Approved', 'Paid', 'Repayment Pending'] }
        }).sort({ timelineDate: 1, createdAt: 1 });

        let remainingRecharge = parseFloat(rechargeAmount);
        let totalDeducted = 0;
        const clearedInvoices = [];

        for (const invoice of pendingInvoices) {
            const baseAmount = invoice.approvedAmount || invoice.amount || 0;
            const fee = invoice.processingFee || 0;
            const penalty = invoice.penaltyAmount || 0;
            const totalDue = baseAmount + fee + penalty;

            if (remainingRecharge >= totalDue) {
                // Fully clear invoice
                invoice.status = 'Cleared';
                await invoice.save();

                remainingRecharge -= totalDue;
                totalDeducted += totalDue;
                clearedInvoices.push({
                    lsId: invoice.lsId,
                    amountCleared: totalDue
                });

                // When invoice is cleared, credit back the wallet (restoring the limit used by invoice approval)
                vendor.walletBalance = (vendor.walletBalance || 0) + totalDue;
                vendor.creditScore = Math.min(100, (vendor.creditScore || 100) + 5);

                await WalletTransaction.create({
                    vendor: vendor._id,
                    amount: totalDue,
                    type: 'Credit',
                    description: `Auto-Cleared Invoice #${invoice.lsId || invoice._id.toString().slice(-6)} from ${paymentMethod}`,
                    referenceId: invoice._id,
                    balanceAfter: vendor.walletBalance
                });

                if (typeof sendNotification === 'function') {
                    await sendNotification(
                        vendor._id,
                        `Invoice ${invoice.lsId || ''} (₹${totalDue}) was automatically cleared from your wallet recharge! Credit score +5.`,
                        'success',
                        '/vendor/upload-invoice'
                    );
                }
            }
        }

        // Add remaining recharge amount to vendor wallet
        if (remainingRecharge > 0) {
            vendor.walletBalance = (vendor.walletBalance || 0) + remainingRecharge;
            await WalletTransaction.create({
                vendor: vendor._id,
                type: 'Credit',
                amount: remainingRecharge,
                description: `Wallet Recharge via ${paymentMethod} (Net added after dues)`,
                balanceAfter: vendor.walletBalance
            });
        }

        await vendor.save();

        return {
            clearedInvoices,
            remainingRecharge,
            totalDeducted,
            finalBalance: vendor.walletBalance
        };
    } catch (error) {
        console.error('Error in processAutoDeductionOnRecharge:', error);
        throw error;
    }
};
