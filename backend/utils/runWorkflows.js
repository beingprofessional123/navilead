// utils/workflowRunner.js
const db = require("../models");
const { sendMail } = require("../utils/mail");
const { sendSms } = require("../utils/sms");
const { htmlToText } = require("html-to-text"); // optional, for text fallback
const UserVariable = db.UserVariable;

/**
 * Replace variables like {{first_name}}, {{email}}, {{offer_link}} in text
 * @param {string} text
 * @param {object} variablesMap
 */
function replaceVariables(text, variablesMap) {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
    variablesMap[varName] !== undefined ? variablesMap[varName] : match
  );
}

/**
 * Run workflows based on trigger
 * @param {string} triggerEvent - e.g. "newLeadCreated"
 * @param {object} contextData - extra data (lead, user, etc.)
 */
async function runWorkflows(triggerEvent, contextData = {}) {
  try {
    const workflows = await db.Workflow.findAll({
      where: { triggerEvent, isActive: true },
      include: [{ model: db.WorkflowStep, as: "steps" }],
    });

    if (!workflows.length) {
      console.log("⚡ No workflow found for trigger:", triggerEvent);
      return;
    }

    for (const workflow of workflows) {
      console.log(`⚡ Running workflow: ${workflow.name}`);

      const steps = workflow.steps.sort((a, b) => a.order - b.order);

      // --- Fetch user variables for replacements ---
      let variablesMap = {};
      if (contextData.user?.id) {
        const userVariables = await UserVariable.findAll({
          where: { userId: contextData.user.id },
        });
        userVariables.forEach(({ variableName, variableValue }) => {
          variablesMap[variableName] = variableValue;
        });
      }

      // Add lead fields to variablesMap
      if (contextData.lead) {
        Object.keys(contextData.lead).forEach((key) => {
          variablesMap[key] = contextData.lead[key];
        });
      }

      // Add extra context if available
      if (contextData.extra) {
        Object.keys(contextData.extra).forEach((key) => {
          variablesMap[key] = contextData.extra[key];
        });
      }

      for (const step of steps) {
        let config = step.config;
        if (typeof config === "string") {
          try {
            config = JSON.parse(config);
          } catch {
            config = {};
          }
        }

        // ---------------------------
        // 📩 Send Email Step
        // ---------------------------
        if (step.type === "sendEmail") {
          if (!contextData.lead?.email) {
            console.warn("⚠️ Lead has no email, skipping sendEmail step");
            continue;
          }

          let subject = config.subject || "Welcome!";
          let text = config.body || "Thanks for creating a lead.";
          let html = null;
          let cc = null;
          let attachments = null;

          if (config.emailTemplateId) {
            const template = await db.EmailTemplate.findByPk(config.emailTemplateId);
            if (template) {
              subject = template.subject;
              html = template.emailContent; // HTML version
              text = htmlToText(html); // Convert HTML to text for fallback
              cc = template.ccEmails ? template.ccEmails.split(",") : null;
              attachments = template.attachments || null;
            } else {
              console.warn(`⚠️ Email template ${config.emailTemplateId} not found`);
            }
          }

          // Replace variables using UserVariable + lead + extra
          subject = replaceVariables(subject, variablesMap);
          text = replaceVariables(text, variablesMap);
          if (html) html = replaceVariables(html, variablesMap);

          await sendMail({
            to: contextData.lead.email,
            subject,
            text,
            html,
            cc,
            attachments,
          });

          console.log(`📩 Email sent to ${contextData.lead.email}`);
        }

        // ---------------------------
        // 📱 Send SMS Step
        // ---------------------------
        if (step.type === "sendSms") {
          if (!contextData.lead?.phone) {
            console.warn("⚠️ Lead has no phone, skipping sendSms step");
            continue;
          }

          let message = config.message || "Thanks for creating a lead.";
          let sender = (config.sender || "NaviLead").substring(0, 11);

          if (config.smsTemplateId) {
            const template = await db.SmsTemplate.findByPk(config.smsTemplateId);
            if (template) {
              message = template.smsContent;
            } else {
              console.warn(`⚠️ SMS template ${config.smsTemplateId} not found`);
            }
          }

          // Replace variables using UserVariable + lead + extra
          message = replaceVariables(message, variablesMap);

          await sendSms({
            to: contextData.lead.phone,
            message,
            from: sender,
          });

          console.log(`📱 SMS sent to ${contextData.lead.phone}`);
        }
        // ---------------------------
        // 🔄 Update Status Step
        // ---------------------------
        if (step.type === "updateStatus") {
          if (!step.config?.statusId) {
            console.warn("⚠️ No statusId provided, skipping updateStatus step");
            continue;
          }

          try {
            await db.Lead.update(
              { statusId: step.config.statusId },
              { where: { id: contextData.lead.id } }
            );

            console.log(`✅ Lead ${contextData.lead.id} status updated to ${step.config.statusId}`);
          } catch (err) {
            console.error("❌ Failed to update lead status:", err);
          }
        }
        console.log("Workflow completed ✅");
      }
    }
  } catch (err) {
    console.error("❌ Workflow execution error:", err);
  }
}

module.exports = { runWorkflows };
