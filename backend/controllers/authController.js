require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../models');
const { User, UserVariable, Settings, OfferTemplate, UserPlan, Plan } = db;
const stripe = require('../utils/stripe'); // Your Stripe instance
const status = require('../models/status');
const OtpVerificationTemplate = require('../EmailTemplate/OtpVerificationTemplate');
const { sendMail } = require('../utils/mail');
const otpStore = new Map(); // Temporary in-memory store, can replace with Redis





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


async function ensureDefaultSettings(userId) {
  // 🟢 Fetch all settings for this user
  const existingSettings = await Settings.findAll({ where: { userId } });

  // 🟢 Extract existing keys for this user
  const existingKeys = existingSettings.map(s => s.key);

  // 🟢 Define default settings
  const defaultSettings = [
    { key: 'emailNotifications', value: 'true' },
    { key: 'smsNotifications', value: 'true' },
  ];

  // 🟢 Only keep settings that are missing
  const settingsToCreate = defaultSettings
    .filter(s => !existingKeys.includes(s.key))
    .map(s => ({ ...s, userId }));

  // 🟢 If user already has all defaults, skip insertion
  if (settingsToCreate.length === 0) {
    console.log(`⚙️ Settings already exist for userId=${userId}, skipping creation.`);
  } else {
    await Settings.bulkCreate(settingsToCreate, { ignoreDuplicates: true });
    console.log(`✅ Default settings created for userId=${userId}`);
  }

  // 🟢 Return current settings as an object
  const updatedSettings = await Settings.findAll({ where: { userId } });
  const settingsObj = {};
  updatedSettings.forEach(s => {
    settingsObj[s.key] = s.value === 'true';
  });

  return settingsObj;
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
      status: 'inactive',
      emailVerified: false,
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
      status: 'active',
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
    await createStripeCustomer(user);

    
    await ensureDefaultSettings(user.id);

    res.status(201).json({
      message: 'api.register.success',
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

    // 🚫 Block admin login (user id == 1)
    if (user.id === 1) {
      return res.status(403).json({ message: 'You do not have permission to log in as admin.' });
    }

    // 🚫 Block inactive users
    if (user.status && user.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
    }

    // ✅ Check email verification
    if (!user.emailVerified || user.emailVerified === false) {
      const existingOtp = otpStore.get(email);

      // 🔹 Check if OTP already sent and still valid
      if (
        existingOtp &&
        existingOtp.type === 'emailverification' &&
        Date.now() < existingOtp.expiresAt
      ) {
        const remainingSeconds = Math.ceil((existingOtp.expiresAt - Date.now()) / 1000);
        return res.status(200).json({
          success: false,
          message: `OTP already sent. Please check your email. You can request a new one after ${remainingSeconds} seconds.`,
          otpSent: true,
          type: 'emailverification',
        });
      }

      // 🔹 Otherwise, generate new OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // valid for 10 min
      otpStore.set(email, { otp, expiresAt, type: 'emailverification' });

      const html = OtpVerificationTemplate({
        firstName: user.name || 'User',
        otpCode: otp,
      });

      await sendMail({
        to: email,
        subject: 'Verify Your Email - NaviLead',
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
        html,
      });

      return res.status(200).json({
        success: false,
        message: 'Your email is not verified. An OTP has been sent to your email for verification.',
        otpSent: true,
        type: 'emailverification',
      });
    }


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

    const existingTemplate = await OfferTemplate.findOne({ where: { userId: user.id, status: 'active' } });
    if (!existingTemplate) {
      await OfferTemplate.create({
        userId: user.id,
        title: "Default Template",
        discripton: "Standard offer layout with logo, services.",
        type: 'Default',
        companyName: null,
        companyLogo: null,
        aboutUsDescription: null,
        aboutUsLogo: null,
        status: 'active',
      });
    }

    const userPlanWithDetails = await UserPlan.findOne({
      where: { userId: user.id },  // ✅ use user.id, not userPlan.id
      include: [{ model: Plan, as: 'plan' }]
    });

    await ensureDefaultSettings(user.id);


    res.status(200).json({ message: 'api.login.success', token, user: userData, userPlan: userPlanWithDetails });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'api.login.serverError', error: error.message });
  }
};


exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'api.login.userNotFound' });

    // Only allow admin (id === 1)
    if (user.id !== 1) {
      return res.status(403).json({ message: 'api.login.notAdmin' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'api.login.invalidCredentials' });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      language: user.language,
      createdAt: user.createdAt,
    };

    res.status(200).json({ message: 'api.login.success', token, user: userData });

  } catch (error) {
    console.error('Admin login error:', error);
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

exports.userCurrentPlan = async (req, res) => {
  try {
    const userId = req.user?.id; // added by authMiddleware

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // 🧠 Find user's active plan
    const userPlan = await UserPlan.findOne({
      where: { userId },
      include: [
        {
          model: Plan,
          as: "plan",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // ✅ Return active plan details
    return res.status(200).json({
      success: true,
      plan: userPlan,
    });
  } catch (error) {
    console.error("Error fetching current plan:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user plan",
      error: error.message,
    });
  }
};


//////////////////////////////////////////////////////////////////
// 🔹 SEND OTP (with type)
//////////////////////////////////////////////////////////////////
exports.sendOtp = async (req, res) => {
  try {
    const { email, type, pagesprocess } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required.' });
    if (!type) return res.status(400).json({ message: 'OTP type is required.' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // valid for 10 mins

    // Store OTP with type
    otpStore.set(email, { otp, expiresAt, type });

    const html = OtpVerificationTemplate({
      firstName: user.name || 'User',
      otpCode: otp,
    });

    // Email content
    const subject =
      type === 'emailverification'
        ? 'Verify Your Email - NaviLead'
        : type === 'passwordreset'
          ? 'Reset Password OTP - NaviLead'
          : 'Your OTP Code - NaviLead';

    await sendMail({
      to: email,
      subject,
      text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
      html,
    });

    res.json({
      success: true,
      message: 'OTP sent successfully.',
      type,
      pagesprocess
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending OTP email.' });
  }
};

//////////////////////////////////////////////////////////////////
// 🔹 VERIFY OTP (with type handling)
//////////////////////////////////////////////////////////////////
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, type, pagesprocess } = req.body;
    if (!email || !otp || !type)
      return res.status(400).json({ message: 'Email, OTP, and type are required.' });

    const record = otpStore.get(email);
    if (!record) return res.status(400).json({ message: 'No OTP found or expired.' });

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    if (record.otp !== otp)
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

    // ✅ OTP verified successfully
    otpStore.delete(email);

    // Handle based on OTP type
    if (type === 'emailverification') {
      const user = await User.findOne({ where: { email } });
      if (user) {
        await user.update({ status: 'active', emailVerified: true }); // you can add emailVerified column
      }

       if (pagesprocess === 'login') {
        return res.json({
          success: true,
          message: 'Your email has been verified successfully. You can now log in to your account.',
          type,
          pagesprocess,
        });
      }

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
          stripeCustomerId: user.stripeCustomerId,
        };

      const userPlanWithDetails = await UserPlan.findOne({ where: { userId: user.id }, include: [{ model: Plan, as: 'plan' }] });
      // Generate JWT token 
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '6h' });

      return res.json({
        success: true,
        message: 'Email verified successfully. Logged in!',
        token,
        user: userData,
        userPlan: userPlanWithDetails,
        type,
        pagesprocess
      });
    }

    if (type === 'passwordreset') {
      return res.json({
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
      });
    }

    // fallback
    res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Error verifying OTP.' });
  }
};


//////////////////////////////////////////////////////////////////
// 🔹 RESET PASSWORD
//////////////////////////////////////////////////////////////////
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password are required.' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password.' });
  }
};

