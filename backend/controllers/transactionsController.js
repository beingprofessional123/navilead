const db = require('../models');
const { Transaction, Plan } = db;

exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const transactions = await Transaction.findAll({
      where: { userId },
      include: [
        {
          model: Plan,
          as: 'plan', // direct plan relation from Transaction
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(transactions);
  } catch (err) {
    console.error('Error fetching user transactions:', err);
    res.status(500).json({
      message: 'api.transactions.userFetchError',
      error: err.message
    });
  }
};
