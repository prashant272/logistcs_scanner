const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const authMiddleware = require('../middleware/authMiddleware');

// All plan routes
router.get('/', planController.getPlans);
router.post('/upgrade', authMiddleware, planController.upgradeUserPlan);
router.post('/razorpay-order', authMiddleware, planController.createRazorpayOrder);
router.post('/razorpay-verify', authMiddleware, planController.verifyRazorpayPayment);
router.post('/', planController.createPlan);
router.put('/:id', planController.updatePlan);
router.delete('/:id', planController.deletePlan);

module.exports = router;
