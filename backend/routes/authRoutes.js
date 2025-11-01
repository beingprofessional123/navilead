// routes/user/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin/login', authController.adminLogin);



// Protect all currency routes with authentication
router.use(authMiddleware);

router.get('/user-current-plan', authController.userCurrentPlan);
router.post('/logout', authController.logout);
module.exports = router;
