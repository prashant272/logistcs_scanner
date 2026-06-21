const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', couponController.getCoupons);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.put('/:id/toggle', couponController.toggleCouponStatus);
router.delete('/:id', couponController.deleteCoupon);
router.post('/validate', authMiddleware, couponController.validateCoupon);

module.exports = router;
