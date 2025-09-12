// routes/publicWorkflow.js
const express = require("express");
const router = express.Router();
const runWorkflows = require("../utils/runWorkflows");

// Public endpoint, no auth
router.get("/execute-cron", runWorkflows.executeWorkflowCron);

module.exports = router;
