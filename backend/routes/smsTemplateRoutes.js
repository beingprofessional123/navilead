const express = require('express');
const router = express.Router();
const smsTemplateController = require('../controllers/smsTemplateController');
const authMiddleware = require('../middleware/authMiddleware');
const planValidation = require('../middleware/planValidationMiddleware'); // import


// All routes require authentication
router.use(authMiddleware);

// Get all SMS templates for the authenticated user
router.get('/', smsTemplateController.getAllTemplates);

// Create a new SMS template
router.post('/',planValidation('SMS_Templates'), smsTemplateController.createTemplate);

// Get a single SMS template by ID
router.get('/:id', smsTemplateController.getTemplateById);

// Update a SMS template by ID
router.put('/:id', smsTemplateController.updateTemplate);

// Delete a SMS template by ID
router.delete('/:id', smsTemplateController.deleteTemplate);

module.exports = router;

