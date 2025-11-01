const { Transaction, Plan, SMSCreditPlan, User } = require('../../models');

const TransactionManagementController = {

  // ✅ GET all Transactions (with relations)
  getAllTransactions: async (req, res) => {
    try {
      const transactions = await Transaction.findAll({
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Plan,
            as: 'plan',
            attributes: ['id', 'name', 'price', 'billing_type', 'status']
          },
          {
            model: SMSCreditPlan,
            as: 'smsPlan',
            attributes: ['id', 'name', 'price', 'smsCount', 'status']
          }
        ]
      });

      res.status(200).json({ success: true, transactions });
    } catch (error) {
      console.error('❌ Error fetching Transactions:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

};

module.exports = TransactionManagementController;
