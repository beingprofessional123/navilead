const express = require("express");
const router = express.Router();
const PlanManagementController = require("../../controllers/admin/PlanManagementController");
const authMiddleware = require("../../middleware/authMiddleware");

// Protect all routes
router.use(authMiddleware);

// Routes
router.get("/", PlanManagementController.getAllPlans);
router.post("/", PlanManagementController.createUser);
router.put("/:id", PlanManagementController.updateUser);
router.delete("/:id", PlanManagementController.deleteUser);
router.put("/:id/status", PlanManagementController.updatePlanStatus);


module.exports = router;
