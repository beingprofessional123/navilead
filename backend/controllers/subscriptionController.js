const stripe = require('../utils/stripe');
const { User, Plan, UserPlan, Transaction, PaymentMethod, Settings } = require('../models');
const { sendMail } = require('../utils/mail');
const InvoiceUpcomingTemplate = require('../EmailTemplate/InvoiceUpcomingTemplate');


// Checkout / Create Subscription
exports.checkout = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id; // Auth middleware should set req.user

    // Fetch plan from DB
    const plan = await Plan.findByPk(planId);
    const PaymentMethods = await PaymentMethod.findOne({ where: { userId: userId } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    if (!PaymentMethods) return res.status(404).json({ message: 'Billing details not found' });

    // For paid plans, first check if user already exists in Stripe
    let stripeCustomerId = req.user.stripeCustomerId; // From User model

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
      });

      stripeCustomerId = customer.id;

      // Save stripeCustomerId in DB
      await User.update({ stripeCustomerId }, { where: { id: userId } });
    }

    // Now create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1
        }
      ],
      customer: stripeCustomerId, // use existing or newly created customer
      billing_address_collection: 'required', // ✅ Address, postal code fetch karega
      customer_update: {
        name: 'auto',     // ✅ CardholderName auto update
        address: 'auto',  // ✅ Address + postal code auto update
      },
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    });

    res.status(200).json({
      message: 'Stripe Checkout session created',
      checkoutUrl: session.url,
      stripeCustomerId,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Failed to create subscription', error: error.message });
  }
};



exports.verifySession = async (req, res) => {
  try {
    const { sessionId, oldSubscriptionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'Session ID required' });

    // 1️⃣ If oldSubscriptionId exists, fetch it from Stripe first
    if (oldSubscriptionId) {
      try {
        const oldSubscription = await stripe.subscriptions.retrieve(oldSubscriptionId);

        if (oldSubscription && oldSubscription.status === 'active') {
          await stripe.subscriptions.cancel(oldSubscriptionId);
          console.log('Old subscription canceled:', oldSubscriptionId);
        }
      } catch (err) {
        console.error('Failed to fetch/cancel old subscription:', err);
      }
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!subscriptionId) {
      return res.status(400).json({ message: 'No subscription found in session' });
    }

    // Retrieve full subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Retrieve the latest invoice if exists
    let invoice = null;
    if (subscription.latest_invoice) {
      invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
      console.log("Full invoice object:", invoice);
    }

    // Find the user in your DB
    const user = await User.findOne({ where: { stripeCustomerId: customerId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find the plan in your DB using stripe_price_id from subscription
    const plan = await Plan.findOne({ where: { stripe_price_id: subscription.items.data[0].price.id } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // Check if the user already has a plan
    let userPlan = await UserPlan.findOne({ where: { userId: user.id } });

    // Default start and renewal dates from subscription
    let startDate = new Date(subscription.start_date * 1000);
    let renewalDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;

    // If invoice exists, override with first line item's period
    if (invoice && invoice.lines && invoice.lines.data.length > 0) {
      const lineItem = invoice.lines.data[0];
      startDate = new Date(lineItem.period.start * 1000);
      renewalDate = new Date(lineItem.period.end * 1000);
    }

    const userPlanData = {
      userId: user.id,
      planId: plan.id,
      status: subscription.status,
      startDate: startDate,
      endDate: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      renewalDate: renewalDate,
      subscriptionId: subscription.id,
      autoRenew: !subscription.cancel_at_period_end,
      cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
    };

    if (plan && user) {
      const planSms = plan.Total_SMS_allowed || 0;
      const newSmsBalance = (user.smsBalance || 0) + planSms;
      await user.update({ smsBalance: newSmsBalance });
    }


    if (userPlan) {
      await userPlan.update(userPlanData);
    } else {
      userPlan = await UserPlan.create(userPlanData);
    }

    // Log transaction
    if (invoice) {
      const existingTransaction = await Transaction.findOne({
        where: {
          subscriptionId: subscription.id,
          invoiceUrl: invoice.hosted_invoice_url
        }
      });

      if (!existingTransaction) {
        await Transaction.create({
          userId: user.id,
          planId: plan.id,
          subscriptionId: subscription.id,
          status: invoice.status,
          amount: invoice?.amount_paid ? invoice.amount_paid / 100 : null,
          currency: invoice?.currency || null,
          invoiceUrl: invoice?.hosted_invoice_url || null,
          invoiceNo: invoice?.number || null,
          type: 'subscription'
        });
      }
    }

    const userPlanWithDetails = await UserPlan.findOne({
      where: { id: userPlan.id },
      include: [{ model: Plan, as: 'plan' }]
    });

    // Generate message based on subscription status
    let responseMessage = '';
    switch (subscription.status) {
      case 'active':
        responseMessage = 'Your subscription is active and verified';
        break;
      case 'incomplete':
        responseMessage = 'Your subscription is incomplete. Please complete the payment.';
        break;
      case 'incomplete_expired':
        responseMessage = 'Your subscription attempt expired. Please try again.';
        break;
      case 'past_due':
        responseMessage = 'Your subscription payment is past due. Please update your payment method.';
        break;
      case 'canceled':
        responseMessage = 'Your subscription has been canceled.';
        break;
      case 'unpaid':
        responseMessage = 'Your subscription is unpaid. Please resolve your billing issues.';
        break;
      default:
        responseMessage = 'Your subscription status is ' + subscription.status;
        break;
    }

    // Final response
    res.status(200).json({
      message: responseMessage,
      userPlan: userPlanWithDetails
    });

  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ message: 'Failed to verify subscription', error: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch the user's active or canceled plan
    const userPlan = await UserPlan.findOne({ where: { userId } });
    if (!userPlan) return res.status(404).json({ message: 'No plan found' });

    let endDate = userPlan.endDate;

    // If plan is already canceled
    if (userPlan.status === 'cancelled') {
      // Calculate remaining days
      if (userPlan.endDate) {
        const today = new Date();
        const remainingMs = new Date(userPlan.endDate) - today;
        const remainingDays = Math.max(Math.ceil(remainingMs / (1000 * 60 * 60 * 24)), 0);

        const userPlanWithDetails = await UserPlan.findOne({
          where: { id: userPlan.id },
          include: [{ model: Plan, as: 'plan' }]
        });

        return res.json({
          message: `Subscription already canceled. ${remainingDays} day(s) remaining until it ends.`,
          userPlan: userPlanWithDetails
        });
      } else {
        return res.json({
          message: 'Subscription already canceled.',
          userPlan: userPlanWithDetails
        });
      }
    }

    // Cancel subscription on Stripe if subscriptionId exists
    if (userPlan.subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(userPlan.subscriptionId);

      if (subscription && subscription.status === 'active') {
        const canceledSubscription = await stripe.subscriptions.update(userPlan.subscriptionId, {
          cancel_at_period_end: true
        });

        // Use Stripe's cancel_at timestamp as endDate
        endDate = canceledSubscription.cancel_at
          ? new Date(canceledSubscription.cancel_at * 1000)
          : new Date(canceledSubscription.cancel_at * 1000)
      } else {
        endDate = new Date();
      }
    } else {
      endDate = new Date();
    }

    // Update UserPlan in DB
    await userPlan.update({
      autoRenew: false,
      renewalDate: null,
      endDate: endDate,
      status: 'cancelled',
      cancelledAt: new Date()
    });

    const userPlanWithDetails = await UserPlan.findOne({
      where: { id: userPlan.id },
      include: [{ model: Plan, as: 'plan' }]
    });

    return res.json({
      message: 'Subscription canceled successfully',
      userPlan: userPlanWithDetails
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription', error: error.message });
  }
};

exports.subscriptionRenewWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log(`✅ Stripe event received: ${event.type}`);
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      /**
       * 🔄 Handle subscription updated
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        const user = await User.findOne({
          where: { stripeCustomerId: subscription.customer }
        });

        const PaymentMethods = await PaymentMethod.findOne({ where: { userId: user.id } });

        if (!user) {
          console.error(`❌ No user found for customer ${subscription.customer}`);
          break;
        }

        let userPlan = await UserPlan.findOne({ where: { userId: user.id } });

        let startDate = new Date(subscription.current_period_start * 1000);
        let renewalDate = new Date(subscription.current_period_end * 1000);

        // Try to fetch invoice for accurate period
        let invoice = null;
        if (subscription.latest_invoice) {
          invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
          if (invoice && invoice.lines && invoice.lines.data.length > 0) {
            const lineItem = invoice.lines.data[0];
            startDate = new Date(lineItem.period.start * 1000);
            renewalDate = new Date(lineItem.period.end * 1000);
          }
        }

        const updateData = {
          status: subscription.status,
          startDate,
          renewalDate,
          subscriptionId: subscription.id,
          autoRenew: subscription.cancel_at_period_end ? false : true,
          cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        };

        if (userPlan) {
          await userPlan.update(updateData);
          console.log(`🔄 UserPlan updated for user ${user.id}`);
        } else {
          const plan = await Plan.findOne({
            where: { stripe_price_id: subscription.items.data[0].price.id }
          });

          if (plan) {
            userPlan = await UserPlan.create({
              userId: user.id,
              planId: plan.id,
              ...updateData,
            });
            console.log(`✅ New UserPlan created for user ${user.id}`);
          } else {
            console.error(`❌ Plan not found for price ID: ${subscription.items.data[0].price.id}`);
          }
        }

        break;
      }



      /**
       * 💰 Handle payment succeeded
       */
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;

        const user = await User.findOne({
          where: { stripeCustomerId: invoice.customer }
        });

        if (!user) {
          console.error(`❌ User not found for Stripe customer ID: ${invoice.customer}`);
          break;
        }

        const plan = await Plan.findOne({
          where: { stripe_price_id: invoice.lines.data[0].price.id }
        });

        if (!plan) {
          console.error(`❌ Plan not found for price ID: ${invoice.lines.data[0].price.id}`);
          break;
        }

        // Prevent duplicate transaction (unique invoiceNo)
        const existingTransaction = await Transaction.findOne({
          where: { invoiceNo: invoice.number }
        });

        if (!existingTransaction) {
          await Transaction.create({
            userId: user.id,
            planId: plan.id,
            subscriptionId: invoice.subscription,
            status: invoice.status,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            invoiceUrl: invoice.hosted_invoice_url,
            invoiceNo: invoice.number,
          });
          console.log(`💰 Transaction saved for user ${user.id}, invoice ${invoice.number}`);
        }

        break;
      }



      /**
       * ⏳ Handle upcoming invoice
       */
      case 'invoice.upcoming': {
        const invoice = event.data.object;

        const user = await User.findOne({
          where: { stripeCustomerId: invoice.customer }
        });

        const PaymentMethods = await PaymentMethod.findOne({ where: { userId: user.id } });


        if (user) {
          console.log(`⏳ Upcoming invoice for user: ${user.email}`);

          const htmlTemplate = InvoiceUpcomingTemplate({
            name: user.name,
            invoiceUrl: invoice.hosted_invoice_url,
            amount: invoice.amount_due,
            currency: invoice.currency,
            dueDate: invoice.due_date || invoice.created,
          });

          const emailSetting = await Settings.findOne({
            where: { userId: user.id, key: 'emailNotifications' },
          });


          if (emailSetting.value === 'true') {
            if (PaymentMethods.emailNotifications === true) {
              await sendMail(
              user.id,
              {
                to: user.email,
                subject: 'Upcoming Invoice Reminder',
                text: `Dear ${user.name}, your subscription will renew soon. Invoice: ${invoice.hosted_invoice_url}`,
                html: htmlTemplate,
              });

              console.log(`📧 Upcoming invoice email sent to ${user.email}`);
            }
          } else {
            console.log(`📵 Email notifications are disabled for user ${user.id}. Skipping email.`);
          }







        } else {
          console.error(`❌ User not found for Stripe customer ID: ${invoice.customer}`);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await User.findOne({ where: { stripeCustomerId: subscription.customer } });

        if (!user) {
          console.error(`❌ No user found for customer ${subscription.customer}`);
          break;
        }

        // Just mark user's plan as cancelled
        await UserPlan.update(
          { status: 'cancelled', endDate: new Date(), autoRenew: false },
          { where: { userId: user.id } }
        );

        console.log(`🛑 Subscription deleted for user ${user.id}, marked as cancelled`);
        break;
      }



      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({ message: "Webhook handler failed", error: error.message });
  }
};


