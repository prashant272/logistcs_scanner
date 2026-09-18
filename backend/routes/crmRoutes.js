const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const protect = require('../middleware/authMiddleware');

// All CRM routes are protected
router.use(protect);

router.post('/', crmController.createLead);
router.get('/vendor', crmController.getVendorLeads);
router.get('/vendor/followups', crmController.getFollowUps);
router.put('/:id/status', crmController.updateLeadStatus);
router.post('/:id/note', crmController.addTimelineNote);
router.put('/:id/followup', crmController.scheduleFollowUp);

module.exports = router;
