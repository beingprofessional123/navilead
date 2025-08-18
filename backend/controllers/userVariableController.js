const db = require('../models');
const { UserVariable } = db;

exports.getUserVariables = async (req, res) => {
  try {
    const userId = req.user.id; // assuming authMiddleware attaches user info to req.user

    const variables = await UserVariable.findAll({
      where: { userId }
    });

    res.json(variables);
  } catch (error) {
    console.error('Error fetching user variables:', error);
    res.status(500).json({ message: 'Error fetching user variables', error: error.message });
  }
};
