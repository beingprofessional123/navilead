const express = require('express');
const router = express.Router();
const userVariableController = require('../controllers/userVariableController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get all variables for the authenticated user
router.get('/', userVariableController.getUserVariables);

module.exports = router;
