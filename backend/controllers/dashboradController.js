// controllers/dashboardController.js

const { Op } = require("sequelize");
const {
  Lead,
  Quote,
  AcceptedOffer,
  SendEmail,
  SendSms,
  AskQuestion,
} = require("../models"); // adjust your path if needed

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ from auth middleware

    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 🟢 1. New leads this week
    const newLeadsCount = await Lead.count({
      where: { userId, createdAt: { [Op.between]: [weekAgo, now] } },
    });

    // 🟢 2. Offers sent this month
    const offersSent = await Quote.count({
      where: { userId, createdAt: { [Op.gte]: monthStart } },
    });

    // 🟢 3. Offers accepted this month
    const offersAccepted = await AcceptedOffer.count({
      where: { userId, createdAt: { [Op.gte]: monthStart } },
    });

    // 🟢 4. Conversion rate = offers accepted / total leads
    const totalLeads = await Lead.count({ where: { userId } });
    const conversionRate = totalLeads
      ? ((offersAccepted / totalLeads) * 100).toFixed(2)
      : 0;

    // 🟢 5. Fetch recent data for each activity
    const [recentLeads, recentOffers, recentEmails, recentSms, recentAskQuestion] = await Promise.all([
      Lead.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        attributes: ["id", "fullName", "leadSource", "createdAt"],
      }),
      AcceptedOffer.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        attributes: ["id", "totalPrice", "createdAt"],
        include: [{ model: Quote, as: "quote", attributes: ["id", "title"] }],
      }),
      SendEmail.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        attributes: ["id", "emailSubject", "createdAt"],
        include: [{ model: Quote, as: "Quote", attributes: ["id", "title"] }],
      }),
      SendSms.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        attributes: ["id", "senderName", "createdAt"],
        include: [{ model: Quote, as: "Quote", attributes: ["id", "title"] }],
      }),
      AskQuestion.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        attributes: ["id", "question", "createdAt"],
        include: [{ model: Quote, as: "quote", attributes: ["id", "title"] }],
      }),
    ]);

    // 🟢 6. Merge all into a single timeline (sorted by date)
    const allActivities = [
      ...recentLeads.map((item) => ({ ...item.toJSON(), type: "lead" })),
      ...recentOffers.map((item) => ({ ...item.toJSON(), type: "offer" })),
      ...recentEmails.map((item) => ({ ...item.toJSON(), type: "email" })),
      ...recentSms.map((item) => ({ ...item.toJSON(), type: "sms" })),
      ...recentAskQuestion.map((item) => ({ ...item.toJSON(), type: "question" })),
    ];

    allActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 🟢 7. Send everything to frontend
    res.json({
      success: true,
      data: {
        overview: {
          newLeads: newLeadsCount,
          offersSent,
          offersAccepted,
          conversionRate,
        },
        activities: allActivities, // ✅ unified + sorted
      },
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: err.message,
    });
  }
};
