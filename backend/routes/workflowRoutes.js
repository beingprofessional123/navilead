const express = require('express');
const router = express.Router();

const workflowController = require('../controllers/workflowController');
const authenticate = require('../middleware/authMiddleware');

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
router.post('/', workflowController.createWorkflow);

// Update a workflow
router.put('/:id', workflowController.updateWorkflow);

// Delete a workflow
router.delete('/:id', workflowController.deleteWorkflow);

// -------------------
// Workflow Step Routes
// -------------------

// Add a new step to a workflow
router.post('/:workflowId/steps', workflowController.addStepToWorkflow);

// Update a step in a workflow
router.put('/:workflowId/steps/:stepId', workflowController.updateStepInWorkflow);

// Delete a step from a workflow
router.delete('/:workflowId/steps/:stepId', workflowController.deleteStepFromWorkflow);

module.exports = router;
