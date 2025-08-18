const db = require('../models');
const { Status } = db;

exports.getAllStatuses = async (req, res) => {
  try {
    const { statusFor } = req.query;

    const whereClause = statusFor ? { statusFor } : {};

    const statuses = await Status.findAll({ where: whereClause });

    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching statuses', error: err.message });
  }
};
