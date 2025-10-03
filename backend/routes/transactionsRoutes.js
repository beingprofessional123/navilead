const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const transactionsController = require('../controllers/transactionsController');

// Protect all transactions routes
router.use(authenticate);

// Fetch all transactions
router.get('/', transactionsController.getUserTransactions);

module.exports = router;
