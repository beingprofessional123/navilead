require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');


// Import routes
const authRoutes = require('./routes/authRoutes'); // General user auth
const leadRoutes = require('./routes/leadRoutes'); // <-- Add this line
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


const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

app.get('/', (req, res) => {
  res.send('✅ Navilead Backend is running!');
});

// General user authentication routes
app.use('/api/auth', authRoutes);

// Leads routes
app.use('/api/leads', leadRoutes); // <-- Add this line
app.use('/api/statuses', statusRoutes);
app.use('/api/pricing-templates', pricingTemplateRoutes); // ✅ Add this line
app.use('/api/currencies', currencyRoutes); 
app.use('/api/quotes', quoteRoutes); // ✅ Add this
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/variables', userVariableRoutes);
app.use('/api/send-email-quotes', sendEmailQuoteRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/sms-templates', smsTemplateRoutes);
app.use('/api/send-sms-quotes', sendSmsQuoteRoutes);



// Serve files from the uploads directory under /uploads URL path
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;
