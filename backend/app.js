require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');


// Import routes
const authRoutes = require('./routes/authRoutes');
const UserRoutes = require('./routes/admin/UserRoutes');
const PlanManagementRoutes = require('./routes/admin/PlanManagementRoutes');
const leadRoutes = require('./routes/leadRoutes');
const statusRoutes = require('./routes/statusRoutes');
const pricingTemplateRoutes = require('./routes/pricingTemplateRoutes'); 
const currencyRoutes = require('./routes/currencyRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const userVariableRoutes = require('./routes/userVariableRoutes');
const sendEmailQuoteRoutes = require('./routes/sendEmailQuoteRoutes');
const offerRoutes = require('./routes/offerRoutes'); 
const smsTemplateRoutes = require('./routes/smsTemplateRoutes');
const sendSmsQuoteRoutes = require('./routes/sendSmsQuoteRoutes');
const publicLeadRoutes = require('./routes/publicLeadRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const offersTemplatesRoutes = require('./routes/offersTemplatesRoutes');
const planRoutes = require('./routes/planRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const transactionsRoutes = require('./routes/transactionsRoutes');
const paymentMethodsRoutes = require('./routes/paymentMethodsRoutes');
const smsCreditsRoutes = require('./routes/smsCreditsRoutes');

const workflowRoutes = require('./routes/workflowRoutes');
const publicWorkflowRoutes = require('./routes/publicWorkflowRoutes');
const publicSubscriptionRenewWebhook = require('./routes/publicSubscriptionRenewWebhook');



const app = express();

app.use('/api/public-subscriptions-renew', publicSubscriptionRenewWebhook);

app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

app.get('/', (req, res) => {
  res.send('✅ Navilead Backend is running!');
});

app.use((req, res, next) => {
  console.log(`➡️ Incoming request: ${req.method} ${req.url}`);
  next();
});


// General user and admin authentication routes
app.use('/api/auth', authRoutes);

//Admin
app.use('/api/admin/users', UserRoutes);
app.use('/api/admin/plan-management', PlanManagementRoutes);

//User
app.use('/api/leads', leadRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/pricing-templates', pricingTemplateRoutes);
app.use('/api/currencies', currencyRoutes); 
app.use('/api/quotes', quoteRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/variables', userVariableRoutes);
app.use('/api/send-email-quotes', sendEmailQuoteRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/sms-templates', smsTemplateRoutes);
app.use('/api/send-sms-quotes', sendSmsQuoteRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/offers-templates', offersTemplatesRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/paymentMethods', paymentMethodsRoutes);
app.use('/api/smsCredits', smsCreditsRoutes);


// Public leads route (no auth required)
app.use('/api/public-leads', publicLeadRoutes);
app.use('/api/public-workflows', publicWorkflowRoutes);

// Serve files from the uploads directory under /uploads URL path
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;
