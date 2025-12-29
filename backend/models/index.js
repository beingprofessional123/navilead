const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const User = require('./user');
const Lead = require('./lead');
const Status = require('./status');
const PricingTemplate = require('./pricingTemplate');
const PricingTemplateService = require('./pricingTemplateService');
const Currency = require('./currency');
const Quote = require('./quote');
const QuoteService = require('./quoteService');
const EmailTemplate = require('./emailTemplate');
const UserVariable = require('./userVariable');
const SendEmail = require('./sendEmail');
const AcceptedOffer = require('./acceptedOffer');
const AskQuestion = require('./askQuestion');
const SmsTemplate = require('./smsTemplate');
const SendSms = require('./sendSms');
const ApiLog = require('./ApiLog');
const Settings = require('./Settings');
const Workflow = require('./workflow');
const WorkflowStep = require('./WorkflowStep');
const WorkflowLog = require('./WorkflowLog');
const CronLog = require('./cronlog');
const StatusUpdateLog = require('./statusUpdateLog');
const OfferTemplate = require('./OfferTemplate');
const Plan = require('./plan');
const UserPlan = require('./UserPlan');
const Transaction = require('./Transaction');
const PaymentMethod = require('./PaymentMethod');
const SMSCreditPlan = require('./smsCreditPlan');
const SmtpSetting = require('./SmtpSetting');
const Ticket = require('./ticket');
const TicketMessage = require('./ticketMessage');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = User(sequelize, DataTypes);
db.Lead = Lead(sequelize, DataTypes);
db.Status = Status(sequelize, DataTypes);
db.PricingTemplate = PricingTemplate(sequelize, DataTypes);
db.PricingTemplateService = PricingTemplateService(sequelize, DataTypes);
db.Currency = Currency(sequelize, DataTypes);
db.Quote = Quote(sequelize, DataTypes);
db.QuoteService = QuoteService(sequelize, DataTypes);
db.EmailTemplate = EmailTemplate(sequelize, DataTypes);
db.UserVariable = UserVariable(sequelize, DataTypes); 
db.SendEmail = SendEmail(sequelize, DataTypes);
db.AcceptedOffer = AcceptedOffer(sequelize, DataTypes);
db.AskQuestion = AskQuestion(sequelize, DataTypes);
db.SmsTemplate = SmsTemplate(sequelize, DataTypes);
db.SendSms = SendSms(sequelize, DataTypes);
db.ApiLog = ApiLog(sequelize, DataTypes);
db.Settings = Settings(sequelize, DataTypes);
db.Workflow = Workflow(sequelize, DataTypes);
db.WorkflowStep = WorkflowStep(sequelize, DataTypes);
db.WorkflowLog = WorkflowLog(sequelize, DataTypes);
db.CronLog = CronLog(sequelize, DataTypes);
db.StatusUpdateLog = StatusUpdateLog(sequelize, DataTypes);
db.OfferTemplate = OfferTemplate(sequelize, DataTypes);
db.Plan = Plan(sequelize, DataTypes);
db.UserPlan = UserPlan(sequelize, DataTypes);
db.Transaction = Transaction(sequelize, DataTypes);
db.PaymentMethod = PaymentMethod(sequelize, DataTypes);
db.SMSCreditPlan = SMSCreditPlan(sequelize, DataTypes);
db.SmtpSetting = SmtpSetting(sequelize, DataTypes); 
db.Ticket = Ticket(sequelize, DataTypes);
db.TicketMessage = TicketMessage(sequelize, DataTypes);

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
