const express = require("express");
const router = express.Router();
const TransactionManagementController = require("../../controllers/admin/TransactionManagementController");
const authMiddleware = require("../../middleware/authMiddleware");

// Protect all routes
router.use(authMiddleware);

// Routes
router.get("/", TransactionManagementController.getAllTransactions);

module.exports = router;
