const db = require('../models');
const { Workflow, WorkflowStep, WorkflowLog } = db;

exports.getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.findAll({
      include: [
        {
          model: WorkflowStep,
          as: "steps",
          required: false, // only include step config
        },
        {
          model: WorkflowLog,
          as: "logs",
          required: false, // workflow-level logs
        },
      ],
      order: [
        ["createdAt", "DESC"], // order workflows
        [{ model: WorkflowStep, as: "steps" }, "order", "ASC"], // order steps by step.order
        [{ model: WorkflowLog, as: "logs" }, "createdAt", "ASC"], // order logs by createdAt
      ],
    });

    // Convert to JSON and filter steps & logs by workflowId (just to be safe)
    const formattedWorkflows = workflows.map((wf) => {
      const workflow = wf.toJSON();

      workflow.steps = workflow.steps.filter((step) => step.workflowId === workflow.id);
      workflow.logs = workflow.logs.filter((log) => log.workflowId === workflow.id);

      return workflow;
    });

    res.status(200).json(formattedWorkflows);
  } catch (err) {
    console.error("Error fetching workflows:", err);
    res.status(500).json({
      message: "Error fetching workflows",
      error: err.message,
    });
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
    const { name, triggerEvent, description, isActive, steps } = req.body;

    if (!name || !triggerEvent) {
      return res.status(400).json({ message: "Name and triggerEvent are required" });
    }

    // Workflow belongs to the logged-in user
    const workflow = await Workflow.create({
      name,
      triggerEvent,
      description,
      isActive: isActive || false,
      userId: req.user.id,
    });

    // If steps are provided, create them
    if (steps && Array.isArray(steps)) {
      const stepRecords = steps.map((step, index) => ({
        workflowId: workflow.id,
        type: step.type,
        config: step.config || {},
        order: index + 1,
      }));
      await WorkflowStep.bulkCreate(stepRecords);
    }

    // Fetch workflow with steps
    const createdWorkflow = await Workflow.findOne({
      where: { id: workflow.id },
      include: [{ model: WorkflowStep, as: "steps" }],
    });

    res.status(201).json(createdWorkflow);
  } catch (err) {
    console.error("Error creating workflow:", err);
    res.status(500).json({ message: "Error creating workflow", error: err.message });
  }
};

// Update workflow
// Update workflow along with steps
// Update workflow along with steps
exports.updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, triggerEvent, description, isActive, steps } = req.body;

    // Find existing workflow
    const workflow = await Workflow.findByPk(id, {
      include: [{ model: WorkflowStep, as: 'steps' }]
    });

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // Update workflow details
    await workflow.update({ name, triggerEvent, description, isActive });

    // Handle workflow steps
    if (steps && Array.isArray(steps)) {
      // Delete existing steps
      await WorkflowStep.destroy({ where: { workflowId: workflow.id } });

      // Insert new steps
      const stepRecords = steps.map((step, index) => ({
        workflowId: workflow.id,
        type: step.type,
        config: step.config || {},
        order: index + 1
      }));

      await WorkflowStep.bulkCreate(stepRecords);
    }

    // Fetch updated workflow with steps
    const updatedWorkflow = await Workflow.findOne({
      where: { id: workflow.id },
      include: [{ model: WorkflowStep, as: 'steps' }]
    });

    res.status(200).json(updatedWorkflow);
  } catch (err) {
    console.error('Error updating workflow:', err);
    res.status(500).json({ message: 'Error updating workflow', error: err.message });
  }
};

// Delete workflow
exports.deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the workflow by ID
    const workflow = await Workflow.findByPk(id, {
      include: [{ model: WorkflowStep, as: 'steps' }]
    });

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    // Delete associated steps first (if any)
    if (workflow.steps && workflow.steps.length > 0) {
      await WorkflowStep.destroy({ where: { workflowId: workflow.id } });
    }

    // Delete the workflow
    await workflow.destroy();

    res.status(200).json({ message: 'Workflow deleted successfully' });
  } catch (err) {
    console.error('Error deleting workflow:', err);
    res.status(500).json({ message: 'Error deleting workflow', error: err.message });
  }
};


