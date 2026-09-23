const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const auth = require('../middleware/authMiddleware');

// Public tracking endpoint
router.get('/track/:id', emailController.trackEmailOpen);

// All routes below are protected and require admin privileges
router.route('/smtp-config')
    .get(auth, emailController.getSmtpConfig)
    .post(auth, emailController.saveSmtpConfig);
router.delete('/smtp-config/:id', auth, emailController.deleteSmtpConfig);

router.post('/send-bulk', auth, emailController.createCampaign);

// Campaign routes
router.get('/campaigns', auth, emailController.getCampaigns);
router.delete('/campaigns/:id', auth, emailController.deleteCampaign);

// Template routes
router.route('/templates')
    .get(auth, emailController.getTemplates)
    .post(auth, emailController.saveTemplate);

router.delete('/templates/:id', auth, emailController.deleteTemplate);

module.exports = router;
