const { PaymentMethod } = require('../models');
const stripe = require('../utils/stripe');

// Helper function to validate input based on type
const validatePaymentMethod = (data, type) => {
  const errors = [];

  if (type === "model") {
    // Card number: skip validation if masked
    if (!data.cardNumber || !/^\d{4}$/.test(data.cardNumber)) {
      errors.push("Card number must be exactly Last 4 digits.");
    }


    // Expiry date: accept MM/YY or MM/YYYY
    if (
      !data.expiryDate ||
      !/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(data.expiryDate)
    ) {
      errors.push("Expiry date must be in MM/YY or MM/YYYY format.");
    }

    // CVC: skip validation if masked
    if (!data.cvc || (!/^\d{3,4}$/.test(data.cvc) && data.cvc !== '***')) {
      errors.push("CVC must be 3 or 4 digits.");
    }

    if (!data.cardholderName || data.cardholderName.trim() === "") {
      errors.push("Cardholder name is required.");
    }
    if (!data.cardType || data.cardType.trim() === "") {
      errors.push("Card type is required.");
    }
  }

  if (type === "form") {
    if (!data.companyName || data.companyName.trim() === "") {
      errors.push("Company name is required.");
    }
    if (!data.cvrNumber || data.cvrNumber.trim() === "") {
      errors.push("CVR number is required.");
    }
    if (!data.address || data.address.trim() === "") {
      errors.push("Address is required.");
    }
    if (!data.cityPostalCode || data.cityPostalCode.trim() === "") {
      errors.push("postal code are required.");
    }
    if (typeof data.emailNotifications !== "boolean") {
      errors.push("Email notifications must be true or false.");
    }
  }

  return errors;
};


// Fetch & sync single payment method for user
exports.getPaymentMethods = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({ message: 'User not linked to Stripe customer' });
    }

    // 1️⃣ Fetch latest payment method from Stripe
    const pmList = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
      limit: 1,
    });

    const latestStripePM = pmList.data.length ? pmList.data[0] : null;
    if (!latestStripePM) {
      return res.status(404).json({ message: 'No payment method found on Stripe.' });
    }

    let dbRecord = await PaymentMethod.findOne({ where: { userId: user.id } });

    // 2️⃣ Extract required details
    const cardNumberMasked = latestStripePM.card.last4;
    const expiryDate = `${latestStripePM.card.exp_month}/${latestStripePM.card.exp_year}`;
    const cardholderName = latestStripePM.billing_details.name || dbRecord.cardholderName;
    const cardType = latestStripePM.card.brand;
    const companyName = dbRecord.companyName || user.companyName;
    const address = `${latestStripePM.billing_details.address.line1}, ${latestStripePM.billing_details.address.line2}` || dbRecord.address;
    const cityPostalCode = latestStripePM.billing_details?.postal_code || dbRecord.cityPostalCode;
    const stripepaymentid = latestStripePM.id;


    if (dbRecord) {
      await dbRecord.update({
        cardNumber: cardNumberMasked,
        expiryDate,
        cardholderName,
        cardType,
        companyName,
        address,
        cityPostalCode,
        stripePaymentMethodId: stripepaymentid,
      });
    } else {
      dbRecord = await PaymentMethod.create({
        userId: user.id,
        cardNumber: cardNumberMasked,
        expiryDate,
        cvc: '***', // never store real CVC
        cardholderName,
        cardType,
        companyName,
        address,
        cityPostalCode,
        stripePaymentMethodId: stripepaymentid,
      });
    }

    // 4️⃣ Return the single payment method
    res.status(200).json({
      paymentMethods: [dbRecord],
      latestStripePaymentMethod: latestStripePM,
    });

  } catch (error) {
    console.error('Error fetching payment method:', error);
    res.status(500).json({ message: 'Failed to fetch payment method.' });
  }
};



// Create a new payment method
exports.createPaymentMethod = async (req, res) => {
  try {
    const { type } = req.query;
    const errors = validatePaymentMethod(req.body, type);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const newPaymentMethod = await PaymentMethod.create({
      userId: req.user.id,
      ...req.body,
    });

    res.status(201).json(newPaymentMethod);
  } catch (error) {
    console.error('Error creating payment method:', error);
    res.status(500).json({ message: 'Failed to create payment method.' });
  }
};

// Update an existing payment method (DB + Stripe)
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    // Fetch DB record
    const paymentMethod = await PaymentMethod.findOne({
      where: { id, userId: req.user.id },
    });

    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found.' });
    }

    // Validate input
    const errors = validatePaymentMethod(req.body, type);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Update DB record
    await paymentMethod.update({
      ...req.body,
    });

    // Update Stripe if payment method is linked
    if (paymentMethod.stripePaymentMethodId) {
      const billingDetails = {};

      // Only allowed Stripe fields
      if (req.body.cardholderName) {
        billingDetails.name = req.body.cardholderName;
      }

      if (req.body.address || req.body.cityPostalCode) {
        billingDetails.address = {};
        if (req.body.address) billingDetails.address.line1 = req.body.address;
        if (req.body.cityPostalCode) billingDetails.address.postal_code = req.body.cityPostalCode;
      }

      // Only call Stripe if we have fields to update
      if (Object.keys(billingDetails).length > 0) {
        await stripe.paymentMethods.update(
          paymentMethod.stripePaymentMethodId,
          { billing_details: billingDetails }
        );
      }
    }

    res.status(200).json(paymentMethod);
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ message: 'Failed to update payment method.' });
  }
};

