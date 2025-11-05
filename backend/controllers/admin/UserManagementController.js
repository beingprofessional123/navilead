const bcrypt = require('bcryptjs');
const { User, UserPlan, Plan } = require('../../models');
const { Op } = require('sequelize');


const UserManagementController = {

  // GET all users with plan info
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        where: { id: { [Op.ne]: 1 } }, // Exclude user with id 1
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: UserPlan,
            as: 'userPlans', // This should match your association in User model if exists
            include: [
              {
                model: Plan,
                as: 'plan', // Must match UserPlan.belongsTo alias
                attributes: ['id', 'name', 'Total_SMS_allowed', 'price', 'billing_type'],
              },
            ],
          },
        ],
      });

      // Format users to include only active plan
      const formattedUsers = users.map(user => {
        const activePlan = user.userPlans?.find(up => up.status === 'active')?.plan;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          smsBalance: user.smsBalance,
          companyName: user.companyName,
          plan: activePlan ? activePlan.name : 'No Plan',
          planSmsLimit: activePlan ? activePlan.Total_SMS_allowed : 0,
          planPrice: activePlan ? activePlan.price : 0,
          planBillingType: activePlan ? activePlan.billing_type : '',
          createdAt: user.createdAt,
        };
      });

      res.status(200).json({
        success: true,
        total: formattedUsers.length,
        users: formattedUsers,
      });
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  // GET single user
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        include: [
          {
            model: UserPlan,
            as: 'userPlans',
            include: [{ model: Plan, attributes: ['id', 'name', 'smsLimit'] }],
          },
        ],
      });

      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const activePlan = user.userPlans?.find(up => up.status === 'active')?.Plan;

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          smsBalance: user.smsBalance,
          plan: activePlan ? activePlan.name : 'No Plan',
          planSmsLimit: activePlan ? activePlan.smsLimit : 0,
        },
      });
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  // CREATE new user
  createUser: async (req, res) => {
    try {
      const { name, email, phone, password, companyName } = req.body;

      if (!name || !email || !phone || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, phone and password are required' });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) return res.status(409).json({ success: false, message: 'Email already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, phone, password: hashedPassword, companyName });

      res.status(201).json({ success: true, user: { ...newUser.dataValues } });
    } catch (error) {
      console.error('❌ Error creating user:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  // UPDATE user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, password, companyName } = req.body;

      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (email && email !== user.email) {
        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) return res.status(400).json({ success: false, message: 'Email already in use' });
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : user.password;

      await user.update({ name, email, phone, password: hashedPassword, companyName: companyName });
      res.status(200).json({ success: true, user });
    } catch (error) {
      console.error('❌ Error updating user:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  // DELETE user
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      await user.destroy();
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  updateUserStatus: async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expecting { status: 'active' } or { status: 'inactive' }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = status;
    await user.save();

    res.status(200).json({ success: true, message: `User status updated to ${status}`, user });
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
},
};

module.exports = UserManagementController;
