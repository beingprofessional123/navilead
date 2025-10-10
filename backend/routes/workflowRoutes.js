const express = require('express');
const router = express.Router();

const workflowController = require('../controllers/workflowController');
const authenticate = require('../middleware/authMiddleware');
const planValidation = require('../middleware/planValidationMiddleware');


// ✅ Protect all workflow routes
router.use(authenticate);

// -------------------
// Workflow Routes
// -------------------

// Get all workflows
router.get('/', workflowController.getWorkflows);

// Get single workflow by ID
router.get('/:id', workflowController.getWorkflowById);

// Create a new workflow
router.post('/',planValidation('Workflows'), workflowController.createWorkflow);

// Update a workflow
router.put('/:id', workflowController.updateWorkflow);

// Delete a workflow
router.delete('/:id', workflowController.deleteWorkflow);

module.exports = router;
