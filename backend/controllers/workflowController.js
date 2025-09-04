const db = require('../models');
const { Workflow, WorkflowStep } = db;

// -----------------------------
// Workflows CRUD
// -----------------------------

// Get all workflows with their steps
exports.getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.findAll({
      include: [{ model: WorkflowStep, as: 'steps' }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(workflows);
  } catch (err) {
    console.error('Error fetching workflows:', err);
    res.status(500).json({ message: 'Error fetching workflows', error: err.message });
  }
};

// Get single workflow by ID
exports.getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findByPk(req.params.id, {
      include: [{ model: WorkflowStep, as: 'steps' }],
    });

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    res.status(200).json(workflow);
  } catch (err) {
    console.error('Error fetching workflow:', err);
    res.status(500).json({ message: 'Error fetching workflow', error: err.message });
  }
};

// Create new workflow
exports.createWorkflow = async (req, res) => {
  try {
    const { name, triggerEvent, description, isActive } = req.body;

    const workflow = await Workflow.create({
      name,
      triggerEvent,
      description,
      isActive: isActive || false,
      userId: req.user.id, // assuming you store logged-in user from authMiddleware
    });

    res.status(201).json(workflow);
  } catch (err) {
    console.error('Error creating workflow:', err);
    res.status(500).json({ message: 'Error creating workflow', error: err.message });
  }
};

// Update workflow
exports.updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, triggerEvent, description, isActive } = req.body;

    const workflow = await Workflow.findByPk(id);

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    await workflow.update({ name, triggerEvent, description, isActive });

    res.status(200).json(workflow);
  } catch (err) {
    console.error('Error updating workflow:', err);
    res.status(500).json({ message: 'Error updating workflow', error: err.message });
  }
};

// Delete workflow
exports.deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = await Workflow.findByPk(id);

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    await workflow.destroy();
    res.status(200).json({ message: 'Workflow deleted successfully' });
  } catch (err) {
    console.error('Error deleting workflow:', err);
    res.status(500).json({ message: 'Error deleting workflow', error: err.message });
  }
};

// -----------------------------
// Steps Management
// -----------------------------

// Add a step to workflow
exports.addStepToWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { type, config, order } = req.body;

    const workflow = await Workflow.findByPk(workflowId);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const step = await WorkflowStep.create({
      workflowId,
      type,
      config, // JSON object (like { emailTemplateId: 1 })
      order,
    });

    res.status(201).json(step);
  } catch (err) {
    console.error('Error adding step:', err);
    res.status(500).json({ message: 'Error adding step', error: err.message });
  }
};

// Update step in workflow
exports.updateStepInWorkflow = async (req, res) => {
  try {
    const { workflowId, stepId } = req.params;
    const { type, config, order } = req.body;

    const step = await WorkflowStep.findOne({ where: { id: stepId, workflowId } });

    if (!step) {
      return res.status(404).json({ message: 'Step not found in workflow' });
    }

    await step.update({ type, config, order });
    res.status(200).json(step);
  } catch (err) {
    console.error('Error updating step:', err);
    res.status(500).json({ message: 'Error updating step', error: err.message });
  }
};

// Delete step from workflow
exports.deleteStepFromWorkflow = async (req, res) => {
  try {
    const { workflowId, stepId } = req.params;

    const step = await WorkflowStep.findOne({ where: { id: stepId, workflowId } });

    if (!step) {
      return res.status(404).json({ message: 'Step not found in workflow' });
    }

    await step.destroy();
    res.status(200).json({ message: 'Step deleted successfully' });
  } catch (err) {
    console.error('Error deleting step:', err);
    res.status(500).json({ message: 'Error deleting step', error: err.message });
  }
};
