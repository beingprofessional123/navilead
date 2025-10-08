const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../models');
const { User, UserVariable, OfferTemplate, UserPlan, Plan } = db;
const stripe = require('../utils/stripe'); // Your Stripe instance


function generateApiKey(userId) {
  return crypto
    .createHash('md5')               // MD5 always gives 32 hex chars
    .update(userId.toString())
    .digest('hex');                  // no substring → full 32 chars
}

// ------------------- STRIPE CUSTOMER HELPER -------------------
async function createStripeCustomer(user) {
  // Fetch existing payment method
  let PaymentMethods = await db.PaymentMethod.findOne({ where: { userId: user.id } });

  // If PaymentMethods not exist, create a default/empty record
  if (!PaymentMethods) {
    PaymentMethods = await db.PaymentMethod.create({
      userId: user.id,
      cardNumber: '',
      expiryDate: '',
      cvc: '',
      cardholderName: user.name || '',
      cardType: '',
      companyName: '',
      address: '',
      cityPostalCode: '',
      stripePaymentMethodId: '',
      emailNotifications: true, // optional default
    });
  }

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    address: {
      line1: PaymentMethods.address || '',
      postal_code: PaymentMethods.cityPostalCode || '',
      country: 'DK',
    },
    metadata: {
      companyName: PaymentMethods.companyName || '',
      cvrNumber: PaymentMethods.cvrNumber || '',
    },
  });

  await user.update({ stripeCustomerId: customer.id });

  return customer.id;
}


// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    await OfferTemplate.create({
      userId: user.id,
      title: "Default Template",
      discripton: "Standard offer layout with logo, services.",
      type: 'Default',
      companyName: null,
      companyLogo: null,
      aboutUsDescription: null,
      aboutUsLogo: null,
      status: 'inactive',
    });

    const apiKey = generateApiKey(user.id);
    await user.update({ apikey: apiKey });


    // Insert user variables
    const firstName = name.split(' ')[0] || name;
    const lastName = name.split(' ').slice(1).join(' ') || '';

    const variablesToInsert = [
      { variableName: 'first_name', variableValue: firstName },
      { variableName: 'last_name', variableValue: lastName },
      { variableName: 'full_name', variableValue: name },
      { variableName: 'email', variableValue: email },
      { variableName: "offer_link", variableValue: `${process.env.FRONTEND_URL}/offer/:quoteId` }
    ];

    await UserVariable.bulkCreate(
      variablesToInsert.map(v => ({ ...v, userId: user.id }))
    );

    // -------------------- Create Stripe Customer --------------------
    const stripeCustomerId = await createStripeCustomer(user);


    // Prepare user data (exclude password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      apikey: user.apikey,
      language: user.language,
      currency: user.currency,
      companyName: user.companyName,
      companyLogo: user.companyLogo,
      createdAt: user.createdAt,
      stripeCustomerId: stripeCustomerId,
    };

    // -------------------- Check User Plan --------------------
    let userPlan = await UserPlan.findOne({ where: { userId: user.id }, include: [{ model: Plan, as: 'plan' }] });
    if (!userPlan) {
      const freePlan = await Plan.findOne({ where: { billing_type: 'free' } });
      if (freePlan) {
        userPlan = await UserPlan.create({
          userId: user.id,
          planId: freePlan.id,
          status: 'active',
          startDate: new Date(),
          endDate: null,
          renewalDate: null,
          subscriptionId: null,
          invoiceUrl: null,
          invoiceNo: null,
          autoRenew: false,
          cancelledAt: null
        });
      }
    }

    const userPlanWithDetails = await UserPlan.findOne({
        where: { userId: user.id },  // ✅ use user.id, not userPlan.id
        include: [{ model: Plan, as: 'plan' }]
    });


    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    res.status(201).json({
      message: 'api.register.success',
      token,
      user: userData,
      userPlan: userPlanWithDetails,
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'api.register.emailExists' });
    }
    res.status(500).json({ message: 'api.register.serverError', error: error.message });
  }
};




// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'api.login.userNotFound' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'api.login.invalidCredentials' });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    // ✅ Generate API key only if missing
    let apiKey = user.apikey;
    if (!apiKey || apiKey.trim() === "") {
      apiKey = generateApiKey(user.id);
      await user.update({ apikey: apiKey });
    }

     let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      // Will create Stripe customer and default PaymentMethod if needed
      stripeCustomerId = await createStripeCustomer(user);
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      apikey: apiKey,
      language: user.language,
      currency: user.currency,
      companyName: user.companyName,
      companyLogo: user.companyLogo,
      createdAt: user.createdAt,
      stripeCustomerId: stripeCustomerId,
    };

    // -------------------- Check User Plan --------------------
   let userPlan = await UserPlan.findOne({ where: { userId: user.id }, include: [{ model: Plan, as: 'plan' }] });
    if (!userPlan) {
      const freePlan = await Plan.findOne({ where: { billing_type: 'free' } });
      if (freePlan) {
        userPlan = await UserPlan.create({
          userId: user.id,
          planId: freePlan.id,
          status: 'active',
          startDate: new Date(),
          endDate: null,
          renewalDate: null,
          subscriptionId: null,
          invoiceUrl: null,
          invoiceNo: null,
          autoRenew: false,
          cancelledAt: null
        });
      }
    }

    const existingTemplate = await OfferTemplate.findOne({ where: { userId: user.id } });
    if (!existingTemplate) {
      await OfferTemplate.create({
        userId: user.id,
        title: "Offer Template",
        companyName: null,
        companyLogo: null,
        aboutUsDescription: null,
        aboutUsLogo: null,
      });
    }

   const userPlanWithDetails = await UserPlan.findOne({
        where: { userId: user.id },  // ✅ use user.id, not userPlan.id
        include: [{ model: Plan, as: 'plan' }]
    });


    res.status(200).json({ message: 'api.login.success', token, user: userData, userPlan: userPlanWithDetails });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'api.login.serverError', error: error.message });
  }
};



// LOGOUT
exports.logout = async (req, res) => {
  try {
    // On frontend: remove token (localStorage/cookies)
    // Here, just respond with a success message
    res.status(200).json({ message: 'api.logout.success' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'api.logout.serverError', error: error.message });
  }
};
