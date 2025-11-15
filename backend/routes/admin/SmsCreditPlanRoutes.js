const express = require("express");
const router = express.Router();
// Renamed the variable to be clearer, but kept the file name you provided
const SMSCreditPlanManagementController = require("../../controllers/admin/SMSCreditPlanManagementController"); 
const authMiddleware = require("../../middleware/authMiddleware");

// Protect all routes
router.use(authMiddleware);

// Routes
// Mapped to the correct controller methods for SMS Credit Plans
router.get("/", SMSCreditPlanManagementController.getAllPlans);
router.post("/", SMSCreditPlanManagementController.createPlan); // Corrected: createUser -> createPlan
router.put("/:id", SMSCreditPlanManagementController.updatePlan); // Corrected: updateUser -> updatePlan
router.delete("/:id", SMSCreditPlanManagementController.deletePlan); // Corrected: deleteUser -> deletePlan
router.put("/:id/status", SMSCreditPlanManagementController.updatePlanStatus);


module.exports = router;