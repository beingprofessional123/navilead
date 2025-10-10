const db = require('../models');
const { Lead, UserPlan, Plan } = db;

exports.getRateLimits = async (req, res) => {
  try {
    const userId = req.user.id || req.user.dataValues.id;

    // ✅ Get the user's active plan (there should be only one)
    const activePlan = await UserPlan.findOne({
      include: [{ model: Plan, as: 'plan' }],
    });

    const planDetails = activePlan.plan;

    // ✅ Total leads allowed in this plan
    const totalLeadsAllowed = planDetails.Total_Leads_Allowed;

    // ✅ Count how many leads user already has
    const totalLeadsUsed = await Lead.count({
      where: { userId },
    });

    // ✅ Calculate percentage used
    const usedPercentage = totalLeadsAllowed
      ? ((totalLeadsUsed / totalLeadsAllowed) * 100).toFixed(2)
      : 0;

    // ✅ Check if API access is allowed
    const isApiAccessAllowed = planDetails.api_access ?? false;

    // ✅ Response
    return res.json({
      success: true,
      totalLeadsAllowed,
      totalLeadsUsed,
      usedPercentage: `${usedPercentage}%`,
      isApiAccessAllowed, // added
    });
  } catch (err) {
    console.error('Error fetching rate limits:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching rate limits',
      error: err.message,
    });
  }
};
