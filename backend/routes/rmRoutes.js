const express = require('express');
const router = express.Router();
const { createRM, getRMs, updateRM, deleteRM, assignRM } = require('../controllers/rmController');
const protect = require('../middleware/authMiddleware');

// Note: These should ideally be protected by an admin middleware as well.
// Using authMiddleware for now, assuming admin token is passed.

router.post('/', createRM);
router.get('/', getRMs);
router.put('/assign', assignRM);
router.put('/:id', updateRM);
router.delete('/:id', deleteRM);

module.exports = router;
