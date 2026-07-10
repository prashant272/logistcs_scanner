const express = require('express');
const router = express.Router();
const { createRM, getRMs, updateRM, deleteRM, assignRM, loginRM, getActivityLogs } = require('../controllers/rmController');
const protect = require('../middleware/authMiddleware');

// Note: These should ideally be protected by an admin middleware as well.
// Using authMiddleware for now, assuming admin token is passed.

router.post('/login', loginRM);
router.get('/activity', protect, getActivityLogs);

router.post('/', protect, createRM);
router.get('/', protect, getRMs);
router.put('/assign', protect, assignRM);
router.put('/:id', protect, updateRM);
router.delete('/:id', protect, deleteRM);

module.exports = router;
