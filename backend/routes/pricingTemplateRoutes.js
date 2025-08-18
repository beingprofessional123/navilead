const express = require('express');
const router = express.Router();
const pricingTemplateController = require('../controllers/pricingTemplateController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes below require authentication
router.use(authMiddleware);

// Get all pricing templates for the authenticated user
router.get('/', pricingTemplateController.getAllTemplates);

// Create a new pricing template
router.post('/', pricingTemplateController.createTemplate);

// Get a single pricing template by ID
router.get('/:id', pricingTemplateController.getTemplateById);

// Update a pricing template by ID
router.put('/:id', pricingTemplateController.updateTemplate);

// Delete a pricing template by ID
router.delete('/:id', pricingTemplateController.deleteTemplate);

module.exports = router;
