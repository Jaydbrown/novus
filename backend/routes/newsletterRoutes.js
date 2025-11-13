// ==================== routes/newsletterRoutes.js ====================
const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { newsletterValidation } = require('../middleware/validation');

router.post('/subscribe', newsletterValidation, newsletterController.subscribe);
router.post('/unsubscribe', newsletterValidation, newsletterController.unsubscribe);

module.exports = router;