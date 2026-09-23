const cron = require('node-cron');
const InvoiceRequest = require('../models/InvoiceRequest');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { sendNotification, sendEmail } = require('../utils/notificationService');

const PENALTY_AMOUNT_PER_DAY = 500;
const CREDIT_SCORE_DEDUCTION = 10;

const initCronJobs = () => {
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running daily penalty and reminder checks...');

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const twoDaysFromNow = new Date(today);
            twoDaysFromNow.setDate(today.getDate() + 2);

            // 0. Auto-Pay Due Invoices from Wallet (if balance sufficient)
            const dueInvoicesToAutoPay = await InvoiceRequest.find({
                status: 'Approved',
                timelineDate: { $lte: today }
            }).populate('vendor');

            for (let invoice of dueInvoicesToAutoPay) {
                const vendor = invoice.vendor;
                const baseAmount = invoice.approvedAmount || invoice.amount || 0;
                const fee = invoice.processingFee || 0;
                const penalty = invoice.penaltyAmount || 0;
                const totalDue = baseAmount + fee + penalty;

                if (vendor.walletBalance >= totalDue) {
                    invoice.status = 'Cleared';
                    await invoice.save();

                    vendor.walletBalance -= totalDue;
                    vendor.creditScore = Math.min(100, (vendor.creditScore || 100) + 5);
                    await vendor.save();

                    await WalletTransaction.create({
                        user: vendor._id,
                        type: 'debit',
                        amount: totalDue,
                        description: `Auto-paid Invoice (LS ID: ${invoice.lsId}) on due date`
                    });

                    await sendNotification(vendor._id, `Invoice ${invoice.lsId} (₹${totalDue}) was auto-paid from your wallet balance. Credit score +5.`, 'success', '/vendor/upload-invoice');
                    await sendEmail(vendor.email, 'Invoice Auto-Paid', `<p>Invoice ${invoice.lsId} (₹${totalDue}) was auto-paid from your wallet balance.</p>`);
                }
            }

            // 1. Process Penalties (Timeline Date is in the past)
            const overdueInvoices = await InvoiceRequest.find({
                status: 'Approved',
                timelineDate: { $lt: today }
            }).populate('vendor');

            for (let invoice of overdueInvoices) {
                // Apply daily penalty
                invoice.penaltyAmount += PENALTY_AMOUNT_PER_DAY;
                await invoice.save();

                // Deduct penalty from wallet
                const vendor = invoice.vendor;
                vendor.walletBalance -= PENALTY_AMOUNT_PER_DAY;

                // Deduct credit score (but keep minimum 0)
                vendor.creditScore = Math.max(0, vendor.creditScore - CREDIT_SCORE_DEDUCTION);

                await vendor.save();

                // Log wallet transaction
                await WalletTransaction.create({
                    user: vendor._id,
                    type: 'debit',
                    amount: PENALTY_AMOUNT_PER_DAY,
                    description: `Penalty charged for overdue invoice (LS ID: ${invoice.lsId})`
                });

                // Notify Vendor
                const msg = `Penalty of ₹${PENALTY_AMOUNT_PER_DAY} applied for overdue invoice ${invoice.lsId}. Please repay immediately to avoid further penalties.`;
                await sendNotification(vendor._id, msg, 'error', '/vendor/upload-invoice');
                await sendEmail(vendor.email, 'Invoice Overdue Penalty', `<p>${msg}</p>`);
            }

            // 2. Process Reminders (Timeline date is exactly 2 days from today)
            // Or roughly approaching. We'll find ones where timeline date is tomorrow or day after.
            const upcomingInvoices = await InvoiceRequest.find({
                status: 'Approved',
                timelineDate: {
                    $gte: today,
                    $lte: twoDaysFromNow
                }
            }).populate('vendor');

            for (let invoice of upcomingInvoices) {
                // Determine days left
                const msDiff = new Date(invoice.timelineDate).getTime() - today.getTime();
                const daysLeft = Math.ceil(msDiff / (1000 * 3600 * 24));

                if (daysLeft === 2 || daysLeft === 1 || daysLeft === 0) {
                    const timeText = daysLeft === 0 ? 'TODAY' : `in ${daysLeft} day(s)`;
                    const msg = `Reminder: Repayment for invoice ${invoice.lsId} is due ${timeText}.`;

                    await sendNotification(invoice.vendor._id, msg, 'warning', '/vendor/upload-invoice');
                    await sendEmail(invoice.vendor.email, 'Invoice Repayment Reminder', `<p>${msg}</p>`);
                }
            }

            console.log('[CRON] Daily checks completed successfully.');
        } catch (error) {
            console.error('[CRON ERROR]', error);
        }
    });

    // Run every minute for scheduled enquiry broadcasts
    cron.schedule('* * * * *', async () => {
        try {
            const Enquiry = require('../models/Enquiry');
            const { triggerVendorBroadcast } = require('../controllers/enquiryController');
            const now = new Date();

            // Find enquiries that are scheduled, not yet broadcasted, and the time has passed
            const pendingBroadcasts = await Enquiry.find({
                isBroadcasted: false,
                scheduledBroadcastTime: { $lte: now, $ne: null }
            });

            for (const enquiry of pendingBroadcasts) {
                console.log(`[CRON] Executing scheduled broadcast for enquiry: ${enquiry._id}`);
                await triggerVendorBroadcast(enquiry._id);
            }
        } catch (error) {
            console.error('[CRON ERROR] Scheduled broadcast cron job:', error);
        }
    });
};

module.exports = { initCronJobs };
