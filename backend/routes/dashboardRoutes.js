// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboradController = require('../controllers/dashboradController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// ✅ Protected Auth Routes
router.get('/', dashboradController.getDashboardData);

module.exports = router;
