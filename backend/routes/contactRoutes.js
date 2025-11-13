// ==================== routes/contactRoutes.js ====================
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { contactValidation } = require('../middleware/validation');

router.post('/', contactValidation, contactController.createContact);

module.exports = router;
