// routes/user/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ✅ Public Auth Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin/login', authController.adminLogin);
router.post('/otp-send', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
