const db = require('../models');
const { ApiLog, Settings } = db;

exports.getRateLimits = async (req, res) => {
  try {
    // Sequelize instance → extract plain values
    const userId = req.user.id || req.user.dataValues.id;

    // Fetch all API logs for the user
    const logs = await ApiLog.findAll({
      where: { userId: userId }, // ✅ correct column
      order: [['createdAt', 'DESC']],
    });

    // Count requests made today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const requestsToday = logs.filter(
      log => log.createdAt.toISOString().startsWith(today)
    ).length;

    // Get daily limit from Settings table
    const dailyLimitSetting = await Settings.findOne({
      where: { key: 'api_Daily_limit' },
    });
    const dailyLimit = dailyLimitSetting ? Number(dailyLimitSetting.value) : 5;

    // Calculate percentage used
    const usedPercentage = dailyLimit
      ? Math.min(Math.round((requestsToday / dailyLimit) * 100), 100)
      : 0;

    res.json({
      userId,
      requestsToday,
      dailyLimit,
      usedPercentage,
    });
  } catch (err) {
    console.error('Error fetching rate limits:', err);
    res.status(500).json({ message: 'Error fetching rate limits', error: err.message });
  }
};
