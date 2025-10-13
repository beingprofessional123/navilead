// controllers/smsCreditsController.js
const db = require('../models');
const { SMSCreditPlan, Transaction,User,UserPlan,Plan } = db;
const stripe = require('../utils/stripe');

exports.getAllPlanList = async (req, res) => {
  try {
    const allSmsPlans = await SMSCreditPlan.findAll({ where: { status: 'active' } });
    res.json(allSmsPlans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch SMS credit plans' });
  }
};

exports.getAllTransactionHistoy = async (req, res) => {
  try {
    const allTransactions = await Transaction.findAll({
      where: { type: 'credit' },
      include: [
        {
          model: SMSCreditPlan, // Include the related SMS plan
          as: 'smsPlan',        // Must match the alias in the association
          attributes: ['id', 'name', 'price', 'smsCount', 'status'] // Optional: pick fields you want
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(allTransactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};


exports.getAllCurrentBalance = async (req, res) => {
  try {
    const userId = req.user.id; // authMiddleware sets req.user

    // 1️⃣ Fetch the user's current SMS balance from the users table
    const user = await User.findOne({
      where: { id: userId },
      attributes: ['smsBalance'], // Only fetch smsBalance
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2️⃣ Return the balance
    res.json({ currentBalance: user.smsBalance || 0 });

  } catch (err) {
    console.error('Error fetching current SMS balance from user table:', err);
    res.status(500).json({ error: 'Failed to fetch current SMS balance' });
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const plan = await SMSCreditPlan.findByPk(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const amount = Math.round(plan.price * 100); // amount in cents

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: user.stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'dkk',
            product_data: { name: plan.name, description: plan.description },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        planId: plan.id,        // ✅ Add plan ID
        planName: plan.name,    // optional, for convenience
      },
      success_url: `${process.env.FRONTEND_URL}/sms-credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/sms-credits/cancel`,
    });

    res.status(200).json({
      message: 'Stripe Checkout session created',
      checkoutUrl: session.url, // ✅ name matches frontend
    });

  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ message: 'Failed to create Stripe checkout session', error: err.message });
  }
};



exports.verifySession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId)
      return res.status(400).json({ message: 'Session ID is required' });

    // 1️⃣ Retrieve Stripe Checkout Session with line items & latest_charge expanded
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product', 'payment_intent.latest_charge']
    });

    const paymentIntent = session.payment_intent; // already expanded
    if (!paymentIntent)
      return res.status(400).json({ message: 'No PaymentIntent found in session' });

    const latestCharge = paymentIntent.latest_charge;
    const receiptUrl = latestCharge?.receipt_url || null;

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed yet' });
    }

    const planId = session.metadata.planId;
    if (!planId) return res.status(400).json({ message: 'Plan ID not found in session metadata' });

    const plan = await SMSCreditPlan.findByPk(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });


    // 2️⃣ Check if transaction already exists
    const existingTransaction = await Transaction.findOne({
      where: { subscriptionId: paymentIntent.id }
    });

    if (existingTransaction) {
      const user = await User.findOne({ where: { stripeCustomerId: paymentIntent.customer } });
      return res.status(200).json({
        message: 'Transaction already recorded.',
        currentBalance: user.smsBalance,
        transaction: existingTransaction,
        plan,
      });
    }

    // 3️⃣ Find user and plan
    const user = await User.findOne({ where: { stripeCustomerId: paymentIntent.customer } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    
    // 4️⃣ Update SMS balance and log transaction
    user.smsBalance = (user.smsBalance || 0) + plan.smsCount;
    await user.save();

    const transaction = await Transaction.findOrCreate({
      where: { subscriptionId: paymentIntent.id },
      defaults: {
        userId: user.id,
        smsPlanId: plan.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        invoiceUrl: receiptUrl,
        type: 'credit',
      }
    });

    res.status(200).json({
      message: `Payment successful! ${plan.smsCount} SMS added to your balance.`,
      currentBalance: user.smsBalance,
      transaction,
      plan,
    });

  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};



