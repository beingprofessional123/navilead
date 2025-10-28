const express = require("express");
const router = express.Router();
const UserManagementController = require("../../controllers/admin/UserManagementController");
const authMiddleware = require("../../middleware/authMiddleware");

// Protect all routes
router.use(authMiddleware);

// Routes
router.get("/", UserManagementController.getAllUsers);
router.post("/", UserManagementController.createUser);
router.get("/:id", UserManagementController.getUserById);
router.put("/:id", UserManagementController.updateUser);
router.delete("/:id", UserManagementController.deleteUser);
router.put("/:id/status", UserManagementController.updateUserStatus);


module.exports = router;
