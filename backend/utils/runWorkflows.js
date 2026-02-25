const db = require("../models");
const { Op } = require("sequelize");
const { sendMail } = require("../utils/mail");
const { sendSms } = require("../utils/sms");
const { htmlToText } = require("html-to-text");
const UserVariable = db.UserVariable;
const User = db.User;
const cronLog = db.cronLog;
const Status = db.Status;
const StatusUpdateLog = db.StatusUpdateLog;
const Settings = db.Settings;
const SendSms = db.SendSms;
const StanderdEmailTemplate = require('../EmailTemplate/StanderdEmailTemplate');
const user = require("../models/user");


/**
 * Safely parse step config (string or object)
 */
function parseConfig(config) {
  if (!config) return {};
  if (typeof config === "string") {
    try {
      return JSON.parse(config);
    } catch {
      return {};
    }
  }
  return config;
}

/** Replace variables like {{first_name}} in text */
function replaceVariables(text = "", variablesMap = {}, lead = {}) {
  if (!text) return "";

  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    // 1️⃣ User-defined variables (DB variables)
    if (variablesMap[varName] !== undefined && variablesMap[varName] !== "") {
      return variablesMap[varName];
    }

    // 2️⃣ Lead-based variables
    switch (varName) {
      case "lead_full_name":
        return lead.fullName || "";

      case "lead_phone":
        return lead.phone || "";

      case "lead_email":
        return lead.email || "";

      case "lead_company_name":
        return lead.companyName || "";

      case "lead_cvr_number":
        return lead.cvrNumber || "";

      case "lead_address":
        return lead.address || "";

      default:
        return match; // keep placeholder unchanged
    }
  });
}


function formatIST(date) {
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

/** Convert delay + unit to milliseconds */
function delayToMs(delay = 0, unit = "minutes") {
  delay = Number(delay) || 0;
  switch (unit) {
    case "hours": return delay * 60 * 60 * 1000;
    case "days": return delay * 24 * 60 * 60 * 1000;
    default: return delay * 60 * 1000; // minutes
  }
}


/**
 * Execute a single step given its log row and config.
 * - baseTime: Date from which waitDelay counts (Date instance)
 * Returns: { executed: boolean, ready: boolean }
 * - executed: true when step got executed and marked done
 * - ready: whether step is ready to be executed (for waitDelay it means delay elapsed)
 *
 * NOTE: This updates the WorkflowLog row (status/executedAt) when executed.
 */
async function executeSingleStep(logRow, stepRow, configObj, variablesMap, baseTime) {
  const now = new Date();

  // waitDelay
  if (stepRow.type === "waitDelay") {
    const delayMs = delayToMs(configObj.delay, configObj.unit);
    const readyTime = new Date(baseTime.getTime() + delayMs);

    if (now < readyTime) {
      console.log(`⏳ waitDelay not ready. Executes at ${readyTime}`);
      return { executed: false };
    }

    await logRow.update({ status: "done", executedAt: now });
    return { executed: true };
  }

  // sendEmail
  if (stepRow.type === "sendEmail") {
    const lead = await db.Lead.findByPk(logRow.leadId);
    if (!lead?.email) {
      await logRow.update({ status: "done", executedAt: now });
      console.warn(`No email for lead ${logRow.leadId}`);
      return { executed: true, ready: true };
    }

    let subject = configObj.subject || "Welcome!";
    let html = null;
    let text = configObj.body || "Thanks for creating a lead.";
    let cc = null;
    let attachments = null;
    let template = null;

    if (configObj.emailTemplateId) {
      template = await db.EmailTemplate.findByPk(configObj.emailTemplateId);
      if (template) {
        subject = template.subject;
        html = template.emailContent;
        text = htmlToText(html);
        cc = template.ccEmails ? template.ccEmails.split(",") : null;
        attachments = template.attachments || null;
      }
    }

    subject = replaceVariables(subject, variablesMap, lead);
    text = replaceVariables(text, variablesMap, lead);
    if (html) html = replaceVariables(html, variablesMap, lead);

    // Format attachments (safe)
    let formattedAttachments = [];
    if (template && Array.isArray(template.attachments)) {
      formattedAttachments = template.attachments.map(att => ({
        filename: att.originalName || att.filename,
        path: att.url || att.path
      }));
    }


    const emailSetting = await Settings.findOne({
      where: { userId: lead.userId, key: 'emailNotifications' },
    });


    if (emailSetting.value === 'true') {

      // Build final HTML body using your template
      const usersss = await db.User.findByPk(template.userId);
      const htmlBody = StanderdEmailTemplate({
        emailSubject: subject,
        emailBody: html || text,
        signature: usersss.emailSignature || "",
        attachments: formattedAttachments
      });

      // Send email
      await sendMail(lead.userId, {
        to: lead.email,
        subject,
        text,              // plain text version
        html: htmlBody,    // formatted full HTML body
        cc,
        attachments: formattedAttachments
      });

      console.log(`📩 Step ${logRow.orderNo} sendEmail executed for lead ${logRow.leadId}`);
      await logRow.update({ status: "done", executedAt: now });
      return { executed: true, ready: true };
    } else {
      console.log(`📵 Email notifications are disabled for user ${lead.userId}. Skipping email.`);
      await logRow.update({ status: "pending", executedAt: now });
      return { executed: true, ready: true };
    }

  }

  // sendSms
  if (stepRow.type === "sendSms") {
    const lead = await db.Lead.findByPk(logRow.leadId);
    if (!lead?.phone) {
      await logRow.update({ status: "done", executedAt: now });
      console.warn(`No phone for lead ${logRow.leadId}`);
      return { executed: true, ready: true };
    }

    const userId = lead.userId;
    const user = await db.User.findByPk(userId);

    // Check SMS balance
    if (!user || user.smsBalance <= 0) {
      console.warn(`User ${userId} has 0 SMS balance. SMS not sent.`);
      await logRow.update({ status: "pending", executedAt: now });
      return { executed: false, ready: true };
    }


    let message = configObj.message || "Thanks for creating a lead.";
    let sender = (configObj.sender || "NaviLead").substring(0, 11);

    if (configObj.smsTemplateId) {
      const template = await db.SmsTemplate.findByPk(configObj.smsTemplateId);
      if (template) message = template.smsContent;
    }

    message = replaceVariables(message, variablesMap, lead);

    const smsSetting = await Settings.findOne({
      where: { userId: user.id, key: 'smsNotifications' },
    });


    if (smsSetting.value === 'true') {

      // --- Calculate segments ---
      const { segments } = getSmsSegments(message);

      // --- Check balance BEFORE sending ---
      if (user.smsBalance < segments) {
        console.log(
          `❌ User ${user.id} does not have enough SMS balance. ` +
          `Required: ${segments}, Available: ${user.smsBalance}. Step marked as pending.`
        );
        await logRow.update({ status: "pending", executedAt: now });
        return { executed: false, ready: true }; // return early
      }

      const smsRecord = await SendSms.create(
        {
          userId,
          quoteId: null,
          leadId: logRow.leadId,
          recipientPhone: lead.phone,
          smsMessage: message,
          smsTemplateId: configObj.smsTemplateId || null,
          senderName: sender || 'NaviLead',
        },
      );

      const smsResponse = await sendSms({
        to: lead.phone,
        message: message,
        from: (sender || 'NaviLead').substring(0, 10),
      });

      if (smsResponse && smsResponse) {
        await smsRecord.update(
          { spendCredits: smsResponse },
        );
      }

      // ---- DYNAMIC SEGMENT BASED DEDUCTION ----
      let segmentsUsed = 1;

      if (
        smsResponse &&
        smsResponse.usage &&
        smsResponse.usage.countries
      ) {
        const countries = smsResponse.usage.countries;

        // Sum all SMS segment counts dynamically
        segmentsUsed = Object.values(countries).reduce(
          (sum, val) => sum + val,
          0
        );
      }

      console.log(`📩 Total Segments Used: ${segmentsUsed}`);

      // Deduct segments from balance
      const newBalance = user.smsBalance - segmentsUsed;
      await db.User.update(
        { smsBalance: newBalance },
        { where: { id: userId } }
      );

      console.log(`📱 Step ${logRow.orderNo} sendSms executed for lead ${logRow.leadId}`);
      await logRow.update({ status: "done", executedAt: now });
      console.log(`💰 Deducted ${segmentsUsed} SMS credits from user ${userId}. New balance: ${newBalance}`);

    } else {
      console.log(`📵 SMS notifications are disabled for user ${user.id}. Skipping SMS.`);
      await logRow.update({ status: "pending", executedAt: now });
    }

    return { executed: true, ready: true };
  }

  // updateStatus
  if (stepRow.type === "updateStatus") {
    if (!configObj.statusId) {
      await logRow.update({ status: "done", executedAt: now });
      return { executed: true, ready: true };
    }
    await db.Lead.update({ statusId: configObj.statusId }, { where: { id: logRow.leadId } });
    await logRow.update({ status: "done", executedAt: now });
    await StatusUpdateLog.create({
      leadId: logRow.leadId,
      statusId: configObj.statusId,
    });
    console.log(`🔄 Step ${logRow.orderNo} updateStatus executed for lead ${logRow.leadId}`);
    return { executed: true, ready: true };
  }

  if (stepRow.type === "condition") {
    console.log(`⏱ Evaluating condition for step order ${logRow.orderNo} with config:`, stepRow.config);

    const {
      field,
      value: frontValue,
      operator,
      ifTrueAction,
      ifFalseAction,
      jumpToTrueOrder,
      jumpToFalseOrder,
    } = configObj;

    if (field === "leadValue" || field === "leadSource" || field === "email" || field === "phone" || field === "companyName" || field === "status" || field === "tags") {
      let sequelizeOperator;
      let valueToCompare = frontValue;

      switch (operator) {
        case "equals":
          sequelizeOperator = Op.eq;
          break;
        case "notEquals":
          sequelizeOperator = Op.ne;
          break;
        case "contains":
          sequelizeOperator = Op.like;
          valueToCompare = `%${frontValue}%`;
          break;
        case "greaterThan":
          sequelizeOperator = Op.gt;
          break;
        case "lessThan":
          sequelizeOperator = Op.lt;
          break;
        default:
          sequelizeOperator = Op.eq;
      }

      let dbField = field;

      // Map frontend field → DB column
      if (field === "leadValue") {
        dbField = "value";
      }

      if (field === "status") {
        dbField = "statusId";
      }

      let leads = [];

      if (field === "tags") {

        const frontTags = frontValue
          .split(",")
          .map(t => t.trim())
          .filter(Boolean);

        const allLeads = await db.Lead.findAll({
          where: { userId: logRow.userId }
        });

        leads = allLeads.filter(lead => {
          if (!lead.tags) return false;

          let leadTags = [];

          try {
            leadTags = typeof lead.tags === "string"
              ? JSON.parse(lead.tags)
              : lead.tags;
          } catch {
            return false;
          }

          switch (operator) {
            case "equals":
              return frontTags.every(tag => leadTags.includes(tag));

            case "notEquals":
              return !frontTags.every(tag => leadTags.includes(tag));

            case "contains":
              return frontTags.some(tag => leadTags.includes(tag));

            default:
              return false;
          }
        });

        console.log("Matching Leads:", leads.map(l => l.id));


      } else {
        // Check condition against leads
        leads = await db.Lead.findAll({
          where: {
            userId: log.userId,
            [dbField]: { [sequelizeOperator]: valueToCompare },
          },
        });

      }

      const conditionPassed = leads.length > 0;

      if (conditionPassed) {
        switch (ifTrueAction) {
          case "continue":
            console.log("➡️ Continue (no jump)");
            break;
          case "end":
            await endWorkflow(logRow.workflowId, logRow.leadId);
            break;
          case "jump":
            await executeNextStep(jumpToTrueOrder, logRow.leadId, logRow.workflowId);
            break;
        }
      } else {
        switch (ifFalseAction) {
          case "continue":
            console.log("➡️ Continue (no jump)");
            break;
          case "end":
            await endWorkflow(logRow.workflowId, logRow.leadId);
            break;
          case "jump":
            await executeNextStep(jumpToFalseOrder, logRow.leadId, logRow.workflowId);
            break;
        }
      }
    }
  } else {
    // unknown step type
    await logRow.update({ status: "done", executedAt: now });
    console.warn(`Unknown step type "${stepRow.type}" - marked done`);
  }
  return { executed: true, ready: true };
}


/**
 * runWorkflows(triggerEvent, contextData)
 * Called on trigger (e.g. newLeadCreated). Creates logs for ALL steps up front,
 * then attempts to execute sequentially as far as possible.
 *
 * contextData: { lead, user, extra? }
 */
async function runWorkflows(triggerEvent, contextData = {}) {
  try {
    const workflows = await db.Workflow.findAll({
      where: {
        triggerEvent,
        isActive: true,
        userId: contextData.user?.id,
      },
      include: [{ model: db.WorkflowStep, as: "steps" }],
    });

    if (!workflows.length) {
      console.log("⚡ No active workflows for", triggerEvent);
      return;
    }

    for (const workflow of workflows) {
      console.log(`⚡ Triggered workflow "${workflow.name}" for lead ${contextData.lead?.id}`);

      const steps = (workflow.steps || [])
        .slice()
        .sort((a, b) => a.order - b.order);

      if (!steps.length) continue;

      // 🔹 Build variablesMap
      let variablesMap = {};

      if (contextData.user?.id) {
        const userVariables = await UserVariable.findAll({
          where: { userId: contextData.user.id },
        });

        userVariables.forEach(({ variableName, variableValue }) => {
          variablesMap[variableName] = variableValue;
        });
      }

      if (contextData.lead) {
        Object.keys(contextData.lead.dataValues || contextData.lead).forEach((key) => {
          variablesMap[key] = contextData.lead[key];
        });
      }

      if (contextData.extra) {
        Object.keys(contextData.extra).forEach((key) => {
          variablesMap[key] = contextData.extra[key];
        });
      }

      // 🔹 Create logs if not already created
      const logs = [];
      for (const step of steps) {
        let existingLog = await db.WorkflowLog.findOne({
          where: {
            workflowId: workflow.id,
            leadId: contextData.lead?.id,
            stepId: step.id,
          },
        });

        if (!existingLog) {
          existingLog = await db.WorkflowLog.create({
            userId: contextData.user?.id,
            workflowId: workflow.id,
            leadId: contextData.lead?.id,
            stepId: step.id,
            orderNo: step.order,
            status: "pending",
            executedAt: null,
          });
        } else if (existingLog.status === "done") {
          existingLog.status = "pending";
          existingLog.executedAt = null;
          await existingLog.save();
        }

        logs.push({ log: existingLog, step });
      }

      // 🔹 Sequential execution pointer
      let pointerIndex = 0;

      while (pointerIndex < logs.length) {
        const { log, step } = logs[pointerIndex];

        // Skip already done steps
        if (log.status === "done") {
          pointerIndex++;
          continue;
        }

        // Enforce strict sequential dependency
        if (pointerIndex > 0) {
          const prevLog = logs[pointerIndex - 1].log;
          if (prevLog.status !== "done") {
            console.log(`⛔ Waiting for previous step ${prevLog.orderNo}`);
            break;
          }
        }

        // Base time logic
        let baseTime;

        if (pointerIndex === 0) {
          baseTime = new Date(log.createdAt); // 🔥 Delay starts from trigger time
        } else {
          const prevLog = logs[pointerIndex - 1].log;
          baseTime = new Date(prevLog.executedAt);
        }

        const configObj = parseConfig(step.config);

        console.log("▶️ Executing step", step.order, "Type:", step.type);

        const result = await executeSingleStep(
          log,
          step,
          configObj,
          variablesMap,
          baseTime
        );

        if (!result.executed) {
          console.log("⏳ Step paused. Cron will resume.");
          break;
        }

        // 🔥 Handle jump logic properly
        if (result.jumpToOrder) {
          const jumpIndex = logs.findIndex(
            (item) => item.step.order === result.jumpToOrder
          );

          if (jumpIndex === -1) {
            console.log("⚠️ Jump target not found. Ending workflow.");
            break;
          }

          pointerIndex = jumpIndex;
          continue;
        }

        if (result.endWorkflow) {
          console.log("🛑 Workflow ended by condition.");
          break;
        }

        pointerIndex++;
      }
    }
  } catch (err) {
    console.error("❌ runWorkflows error:", err);
  }
}

/**
 * executeWorkflowCron(req, res)
 * - Public endpoint to resume pending workflow logs.
 * - It groups pending logs by workflowId + leadId and processes each group sequentially.
 *
 * Call this from your router (GET or POST), or run from cron.
 */

async function initializeFollowupWorkflows(workflow) {
  const { id: workflowId, userId, steps } = workflow;

  if (!steps?.length) return;

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  const transaction = await db.sequelize.transaction();

  try {
    const leads = await db.Lead.findAll({
      where: { userId },
      transaction
    });

    for (const lead of leads) {

      let qualifies = true; // assume true initially

      // 🔎 Check condition steps
      for (const step of sortedSteps) {
        if (step.type !== "condition") continue;

        const config = parseConfig(step.config);
        if (!config?.field || config.field !== "status") continue;

        const currentStatus = lead.statusId;
        const targetValue = Number(config.value);

        let conditionMatched = false;

        switch (config.operator) {
          case "equals":
            conditionMatched = currentStatus === targetValue;
            break;
          case "notEquals":
            conditionMatched = currentStatus !== targetValue;
            break;
        }

        if (!conditionMatched) {
          qualifies = false;
          break;
        }
      }

      // ❌ If lead no longer qualifies → delete logs
      if (!qualifies) {
        await db.WorkflowLog.destroy({
          where: {
            workflowId,
            leadId: lead.id
          },
          transaction
        });

        console.log(
          `🛑 Lead ${lead.id} no longer qualifies for workflow ${workflowId}. Logs removed.`
        );

        continue;
      }

      // ✅ If lead qualifies → check existing logs
      const existingLogs = await db.WorkflowLog.findAll({
        where: {
          workflowId,
          leadId: lead.id
        },
        transaction
      });

      const existingLogMap = new Map(
        existingLogs.map(log => [log.stepId, log])
      );

      // 🔥 FIXED: Only ONE loop (duplicate loop removed)
      for (const step of sortedSteps) {

        // Agar already exist karta hai → skip
        if (existingLogMap.has(step.id)) {
          continue;
        }

        // Agar exist nahi karta → create karo
        await db.WorkflowLog.create({
          userId,
          workflowId,
          leadId: lead.id,
          stepId: step.id,
          orderNo: step.order,
          status: step.order === 1 ? "done" : "pending",
          executedAt: step.order === 1 ? new Date() : null
        }, { transaction });

        console.log(
          `✅ Created log → Workflow ${workflowId}, Lead ${lead.id}, Step ${step.order}`
        );
      }
    }

    await transaction.commit();

  } catch (err) {
    await transaction.rollback();
    console.error("❌ initializeFollowupWorkflows error:", err);
  }
}

async function executeWorkflowCron(req, res) {
  let cronLog = null;
  let processedLeadsCount = 0;
  let processedStepsCount = 0;


  try {
    cronLog = await db.CronLog.create({
      startedAt: new Date(),
      status: "started",
    });

    // Preload workflow trigger type for faster checks
    const workflowMap = {};
    const workflows = await db.Workflow.findAll({
      attributes: ["id", "triggerEvent", "userId"],
      include: [
        {
          model: db.WorkflowStep,
          as: "steps",
        }
      ]
    });

    for (const workflow of workflows) {

      workflowMap[workflow.id] = {
        triggerEvent: workflow.triggerEvent,
        userId: workflow.userId
      };

      // 🔥 Only for followup trigger
      if (workflow.triggerEvent === "followup" && workflow.userId) {
        await initializeFollowupWorkflows(workflow);
      }

    }

    const pendingLogs = await db.WorkflowLog.findAll({
      where: { status: "pending" },
      order: [["workflowId", "ASC"], ["leadId", "ASC"], ["orderNo", "ASC"]],
    });

    if (!pendingLogs.length) {
      // update cron log as completed with zero processed
      await cronLog.update({
        finishedAt: new Date(),
        status: "completed",
        processedLeads: 0,
        processedSteps: 0,
      });
      console.log("No pending workflow logs.");
      if (res) return res.json({ message: "No pending workflow logs." });
      return;
    }

    // Group pending logs by leadId
    const leadGroups = {};
    for (const log of pendingLogs) {
      if (!leadGroups[log.leadId]) leadGroups[log.leadId] = [];
      leadGroups[log.leadId].push(log);
    }

    for (const leadId of Object.keys(leadGroups)) {
      // 👉 Fetch all logs (done + pending) for proper reference
      const allLogs = await db.WorkflowLog.findAll({
        where: { leadId },
        order: [["orderNo", "ASC"]],
      });

      console.log(`\n📝 Pending Workflow Logs for leadId=${leadId} (ordered):`);
      let leadTouched = false;


      for (let i = 0; i < allLogs.length; i++) {
        const log = allLogs[i];

        if (log.status !== "pending") continue; // skip already executed

        leadTouched = true; // we have at least one step processed/attempted
        processedStepsCount++;

        const fullStep = await db.WorkflowStep.findOne({
          where: { id: log.stepId, workflowId: log.workflowId },
        });

        const now = new Date();

        // Determine reference time
        let refTime;
        if (i === 0) {
          refTime = new Date(log.createdAt); // order 1 → createdAt
        } else {
          const prevLog = allLogs[i - 1];

          if (!prevLog.executedAt) {
            console.log(
              `⏱ Cannot execute step order ${log.orderNo}, previous step not done yet`
            );
            break; // wait for previous step
          }

          refTime = new Date(prevLog.executedAt); // ✅ always from prev step executedAt
        }

        // Handle waitDelay steps
        if (fullStep.type === "waitDelay") {
          const delayMs = delayToMs(fullStep.config.delay, fullStep.config.unit);
          const elapsedMs = now - refTime;

          const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
          const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

          if (elapsedMs >= delayMs) {
            await log.update({ status: "done", executedAt: now });
            console.log(
              `✅ Step executed (waitDelay) | Order: ${log.orderNo} | Time passed: ${elapsedMinutes}m ${elapsedSeconds}s`
            );
          } else {
            console.log(
              `⏱ Step waiting (waitDelay) | Order: ${log.orderNo} | Time passed: ${elapsedMinutes}m ${elapsedSeconds}s | Configured: ${fullStep.config.delay} ${fullStep.config.unit || "minutes"}`
            );
            break; // stop here until wait completes
          }
        } else {
          // Non-waitDelay → execute immediately

          const configObj = parseConfig(fullStep.config);

          const userVariables = await UserVariable.findAll({ where: { userId: log.userId } });
          const variablesMap = {};
          userVariables.forEach(({ variableName, variableValue }) => {
            variablesMap[variableName] = variableValue;
          });


          if (fullStep.type === "sendEmail") {
            const lead = await db.Lead.findByPk(log.leadId);

            let subject = "Welcome!";
            let html = null;
            let text = "Thanks for creating a lead.";
            let cc = null;
            let attachments = null;
            let template = null;

            if (configObj.emailTemplateId) {
              template = await db.EmailTemplate.findByPk(configObj.emailTemplateId);
              if (template) {
                subject = template.subject;
                html = template.emailContent;
                text = htmlToText(html);
                cc = template.ccEmails ? template.ccEmails.split(",") : null;
                attachments = template.attachments || null;
              }
            }

            subject = replaceVariables(subject, variablesMap, lead);
            text = replaceVariables(text, variablesMap, lead);
            if (html) html = replaceVariables(html, variablesMap, lead);

            // Format attachments (safe)
            let formattedAttachments = [];
            if (template && Array.isArray(template.attachments)) {
              formattedAttachments = template.attachments.map(att => ({
                filename: att.originalName || att.filename,
                path: att.url || att.path
              }));
            }


            const emailSetting = await Settings.findOne({
              where: { userId: lead.userId, key: 'emailNotifications' },
            });

            if (emailSetting.value === 'true') {
              // Build final HTML body using your template
              const usersss = await db.User.findByPk(template.userId);
              const htmlBody = StanderdEmailTemplate({
                emailSubject: subject,
                emailBody: html || text,
                signature: usersss.emailSignature || "",
                attachments: formattedAttachments
              });

              // Send email
              await sendMail(lead.userId, {
                to: lead.email,
                subject,
                text,              // plain text version
                html: htmlBody,    // formatted full HTML body
                cc,
                attachments: formattedAttachments
              });
              console.log(`📩 Step ${log.orderNo} sendEmail executed for lead ${lead.id}`);
            } else {
              console.log(`📵 Email notifications are disabled for user ${lead.userId}. Skipping email.`);
            }



          }

          if (fullStep.type === "sendSms") {
            const lead = await db.Lead.findByPk(log.leadId);
            if (!lead?.phone) {
              await log.update({ status: "done", executedAt: now });
              console.warn(`No phone for lead ${log.leadId}`);
              continue;
            }

            const userId = log.userId;
            const user = await db.User.findByPk(userId);

            // Check SMS balance before sending
            if (!user || user.smsBalance <= 0) {
              console.warn(`User ${userId} has 0 SMS balance. SMS not sent for lead ${log.leadId}.`);
              await log.update({ status: "pending", executedAt: now });
              continue;
            }

            let message = configObj.message || "Thanks for creating a lead.";
            let sender = (configObj.sender || "NaviLead").substring(0, 11);

            if (configObj.smsTemplateId) {
              const template = await db.SmsTemplate.findByPk(configObj.smsTemplateId);
              if (template) message = template.smsContent;
            }

            message = replaceVariables(message, variablesMap, lead);


            const smsSetting = await Settings.findOne({
              where: { userId: user.id, key: 'smsNotifications' },
            });

            if (smsSetting.value === 'true') {

              // --- Calculate segments ---
              const { segments } = getSmsSegments(message);

              // --- Check balance BEFORE sending ---
              if (user.smsBalance < segments) {
                console.log(
                  `❌ User ${user.id} does not have enough SMS balance. ` +
                  `Required: ${segments}, Available: ${user.smsBalance}. Step marked as pending.`
                );
                await log.update({ status: "pending", executedAt: now });
                return { executed: false, ready: true }; // return early
              }


              const smsRecord = await SendSms.create(
                {
                  userId,
                  leadId: log.leadId,
                  quoteId: null,
                  recipientPhone: lead.phone,
                  smsMessage: message,
                  smsTemplateId: configObj.smsTemplateId || null,
                  senderName: sender || 'NaviLead',
                },
              );

              const smsResponse = await sendSms({
                to: lead.phone,
                message: message,
                from: (sender || 'NaviLead').substring(0, 10),
              });

              if (smsResponse && smsResponse) {
                await smsRecord.update(
                  { spendCredits: smsResponse },
                );
              }

              // ---- DYNAMIC SEGMENT BASED DEDUCTION ----
              let segmentsUsed = 1;

              if (
                smsResponse &&
                smsResponse.usage &&
                smsResponse.usage.countries
              ) {
                const countries = smsResponse.usage.countries;

                // Sum all SMS segment counts dynamically
                segmentsUsed = Object.values(countries).reduce(
                  (sum, val) => sum + val,
                  0
                );
              }

              console.log(`📩 Total Segments Used: ${segmentsUsed}`);

              // Deduct segments from balance
              const newBalance = user.smsBalance - segmentsUsed;
              await db.User.update(
                { smsBalance: newBalance },
                { where: { id: userId } }
              );

              console.log(`📱 Step ${log.orderNo} sendSms executed for lead ${log.leadId}`);
              console.log(`💰 Deducted ${segmentsUsed} SMS credits from user ${userId}. New balance: ${newBalance}`);

            } else {
              console.log(`📵 SMS notifications are disabled for user ${user.id}. Skipping SMS.`);
            }
          }

          if (fullStep.type === "updateStatus") {
            if (configObj.statusId) {
              await db.Lead.update(
                { statusId: configObj.statusId },
                { where: { id: log.leadId } }
              );
            }
            console.log(`🔄 Step ${log.orderNo} updateStatus executed for lead ${log.leadId}`);
          }

          if (fullStep.type === "condition") {
            const {
              field,
              value: frontValue,
              operator,
              ifTrueAction,
              ifFalseAction,
              jumpToTrueOrder,
              jumpToFalseOrder,
            } = configObj;

            if (field === "leadValue" || field === "leadSource" || field === "email" || field === "phone" || field === "companyName" || field === "status" || field === "tags") {
              let sequelizeOperator;
              let valueToCompare = frontValue;

              switch (operator) {
                case "equals":
                  sequelizeOperator = Op.eq;
                  break;
                case "notEquals":
                  sequelizeOperator = Op.ne;
                  break;
                case "contains":
                  sequelizeOperator = Op.like;
                  valueToCompare = `%${frontValue}%`; // partial match
                  break;
                case "greaterThan":
                  sequelizeOperator = Op.gt;
                  break;
                case "lessThan":
                  sequelizeOperator = Op.lt;
                  break;
                default:
                  sequelizeOperator = Op.eq;
              }

              console.log(`Evaluating condition: ${field} ${operator} ${frontValue}`);

              let dbField = field;

              // Map frontend field → DB column
              if (field === "leadValue") {
                dbField = "value";
              }

              if (field === "status") {
                dbField = "statusId";
              }

              let leads = [];

              if (field === "tags") {

                const frontTags = frontValue
                  .split(",")
                  .map(t => t.trim())
                  .filter(Boolean);

                const allLeads = await db.Lead.findAll({
                  where: { userId: log.userId }
                });

                leads = allLeads.filter(lead => {
                  if (!lead.tags) return false;

                  let leadTags = [];

                  try {
                    leadTags = typeof lead.tags === "string"
                      ? JSON.parse(lead.tags)
                      : lead.tags;
                  } catch {
                    return false;
                  }

                  switch (operator) {
                    case "equals":
                      return frontTags.every(tag => leadTags.includes(tag));

                    case "notEquals":
                      return !frontTags.every(tag => leadTags.includes(tag));

                    case "contains":
                      return frontTags.some(tag => leadTags.includes(tag));

                    default:
                      return false;
                  }
                });

                console.log("Matching Leads:", leads.map(l => l.id));


              } else {
                // Check condition against leads
                leads = await db.Lead.findAll({
                  where: {
                    userId: log.userId,
                    [dbField]: { [sequelizeOperator]: valueToCompare },
                  },
                });

              }

              const conditionPassed = leads.length > 0;
              console.log(`Condition result: ${conditionPassed ? "True" : "False"}`);

              // Decide next step based on result
              let workflowEnded = false;

              if (conditionPassed) {
                switch (ifTrueAction) {
                  case "continue":
                    console.log("➡️ Continue (no jump)");
                    break;
                  case "end":
                    await endWorkflow(log.workflowId, log.leadId);
                    workflowEnded = true;
                    break;
                  case "jump":
                    await executeNextStep(jumpToTrueOrder, log.leadId, log.workflowId);
                    break;
                }
              } else {
                switch (ifFalseAction) {
                  case "continue":
                    console.log("➡️ Continue (no jump)");
                    break;
                  case "end":
                    await endWorkflow(log.workflowId, log.leadId);
                    workflowEnded = true;
                    break;
                  case "jump":
                    await executeNextStep(jumpToFalseOrder, log.leadId, log.workflowId);
                    break;
                }
              }

              // Stop further steps if workflow ended
              if (workflowEnded) break;

            }
          }

          await log.update({ status: "done", executedAt: now });
          console.log(
            `✅ Step executed (non-waitDelay) | Order: ${log.orderNo} | Current time: ${now.toLocaleString()}`
          );
        }
      }
      if (leadTouched) processedLeadsCount++;
    }


    await cronLog.update({
      finishedAt: new Date(),
      status: "completed",
      processedLeads: processedLeadsCount,
      processedSteps: processedStepsCount,
    });

    console.log("Workflow cron run completed.");
    // update cron log as completed

    if (res)
      return res.json({
        message: "Workflow cron executed successfully for all leads",
      });
  } catch (err) {
    console.error("❌ executeWorkflowCron failed:", err);

    // update cron log as failed with error message
    if (cronLog) {
      await cronLog.update({
        finishedAt: new Date(),
        status: "failed",
        errorMessage: err.message || String(err),
        processedLeads: processedLeadsCount,
        processedSteps: processedStepsCount,
      });
    }

    if (res)
      return res
        .status(500)
        .json({ message: "Workflow cron failed", error: err.message });
  }
}

async function executeNextStep(orderNo, leadId, workflowId) {
  console.log("➡️ executeNextStep called with:", {
    orderNo,
    leadId,
    workflowId
  });

  const nextStep = await db.WorkflowStep.findOne({
    where: { workflowId, order: orderNo }
  });

  if (!nextStep) {
    console.log("❌ No nextStep found");
    return false;
  }

  let log = await db.WorkflowLog.findOne({
    where: { workflowId, stepId: nextStep.id, leadId }
  });

  if (!log) {
    console.log("❌ No WorkflowLog found. Creating new log.");

    log = await db.WorkflowLog.create({
      workflowId,
      stepId: nextStep.id,
      leadId,
      userId: nextStep.userId,
      orderNo,
      status: "pending"
    });
  } else {
    // 🔥 Reset for re-execution
    await log.update({
      status: "pending",
      executedAt: null
    });
  }

  console.log("🚀 Executing jumped step:", nextStep.id);

  // IMPORTANT: pass refTime manually as now
  await executeStep(log, nextStep, new Date());

  console.log("✅ Jump step executed:", nextStep.id);

  return true;
}



async function endWorkflow(workflowId, leadId = null) {
  console.log("➡️ endWorkflow called with:", {
    workflowId,
    leadId
  });

  const whereClause = { workflowId, status: "pending" };
  if (leadId) {
    whereClause.leadId = leadId;
  }

  console.log("🔎 Update condition:", whereClause);

  try {
    const [updatedCount] = await db.WorkflowLog.update(
      {
        status: "done",
        executedAt: new Date()
      },
      { where: whereClause }
    );

    console.log("📊 Update result:", {
      workflowId,
      leadId,
      updatedCount
    });

    if (updatedCount === 0) {
      console.log("⚠️ No pending steps found to update.");
    } else {
      console.log(
        `🏁 Workflow ${workflowId} ${leadId ? `for lead ${leadId}` : ""} ended successfully. Marked ${updatedCount} steps as done.`
      );
    }

  } catch (error) {
    console.error("❌ Error while ending workflow:", {
      workflowId,
      leadId,
      message: error.message,
      stack: error.stack
    });
  }
}


async function executeStep(log, fullStep, refTime) {
  const now = new Date();
  const configObj = parseConfig(fullStep.config);

  // Load user variables
  const userVariables = await UserVariable.findAll({ where: { userId: log.userId } });
  const variablesMap = {};
  userVariables.forEach(({ variableName, variableValue }) => {
    variablesMap[variableName] = variableValue;
  });

  // ----------------------------
  // WAIT DELAY
  // ----------------------------
  if (fullStep.type === "waitDelay") {
    console.log(`⏱ Evaluating waitDelay for step order ${log.orderNo} with config:`, fullStep.config);
    const delayMs = delayToMs(fullStep.config.delay, fullStep.config.unit);
    const elapsedMs = now - refTime;

    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

    if (elapsedMs >= delayMs) {
      await log.update({ status: "done", executedAt: now });
      console.log(
        `✅ Step executed (waitDelay) | Order: ${log.orderNo} | Time passed: ${elapsedMinutes}m ${elapsedSeconds}s`
      );
    } else {
      console.log(
        `⏱ Step waiting (waitDelay) | Order: ${log.orderNo} | Time passed: ${elapsedMinutes}m ${elapsedSeconds}s | Configured: ${fullStep.config.delay} ${fullStep.config.unit || "minutes"}`
      );
      return;
    }
  }

  // ----------------------------
  // SEND EMAIL
  // ----------------------------
  if (fullStep.type === "sendEmail") {
    console.log(`⏱ Evaluating sendEmail for step order ${log.orderNo} with config:`, fullStep.config);

    const lead = await db.Lead.findByPk(log.leadId);

    let subject = "Welcome!";
    let html = null;
    let text = "Thanks for creating a lead.";
    let cc = null;
    let attachments = null;
    let template = null;

    if (configObj.emailTemplateId) {
      template = await db.EmailTemplate.findByPk(configObj.emailTemplateId);
      if (template) {
        subject = template.subject;
        html = template.emailContent;
        text = htmlToText(html);
        cc = template.ccEmails ? template.ccEmails.split(",") : null;
        attachments = template.attachments || null;
      }
    }

    subject = replaceVariables(subject, variablesMap, lead);
    text = replaceVariables(text, variablesMap, lead);
    if (html) html = replaceVariables(html, variablesMap, lead);

    // Format attachments (safe)
    let formattedAttachments = [];
    if (template && Array.isArray(template.attachments)) {
      formattedAttachments = template.attachments.map(att => ({
        filename: att.originalName || att.filename,
        path: att.url || att.path
      }));
    }


    const emailSetting = await Settings.findOne({
      where: { userId: lead.userId, key: 'emailNotifications' },
    });

    if (emailSetting.value === 'true') {
      // Build final HTML body using your template
      const usersss = await db.User.findByPk(template.userId);
      const htmlBody = StanderdEmailTemplate({
        emailSubject: subject,
        emailBody: html || text,
        signature: usersss.emailSignature || "",
        attachments: formattedAttachments
      });

      // Send email
      await sendMail(lead.userId, {
        to: lead.email,
        subject,
        text,              // plain text version
        html: htmlBody,    // formatted full HTML body
        cc,
        attachments: formattedAttachments
      });
      console.log(`📩 Step ${log.orderNo} sendEmail executed for lead ${lead.id}`);
    } else {
      console.log(`📵 Email notifications are disabled for user ${lead.userId}. Skipping email.`);
    }
  }

  // ----------------------------
  // SEND SMS
  // ----------------------------
  if (fullStep.type === "sendSms") {
    console.log(`⏱ Evaluating sendSms for step order ${log.orderNo} with config:`, fullStep.config);

    const lead = await db.Lead.findByPk(log.leadId);
    if (!lead?.phone) {
      await log.update({ status: "done", executedAt: now });
      console.warn(`No phone for lead ${log.leadId}`);
      return { executed: false, ready: true }; // return early
    }

    const userId = log.userId;
    const user = await db.User.findByPk(userId);

    // Check SMS balance before sending
    if (!user || user.smsBalance <= 0) {
      console.warn(`User ${userId} has 0 SMS balance. SMS not sent for lead ${log.leadId}.`);
      await log.update({ status: "pending", executedAt: now });
      return { executed: false, ready: true }; // return early
    }

    let message = configObj.message || "Thanks for creating a lead.";
    let sender = (configObj.sender || "NaviLead").substring(0, 11);

    if (configObj.smsTemplateId) {
      const template = await db.SmsTemplate.findByPk(configObj.smsTemplateId);
      if (template) message = template.smsContent;
    }

    message = replaceVariables(message, variablesMap, lead);


    const smsSetting = await Settings.findOne({
      where: { userId: user.id, key: 'smsNotifications' },
    });

    if (smsSetting.value === 'true') {

      // --- Calculate segments ---
      const { segments } = getSmsSegments(message);

      // --- Check balance BEFORE sending ---
      if (user.smsBalance < segments) {
        console.log(
          `❌ User ${user.id} does not have enough SMS balance. ` +
          `Required: ${segments}, Available: ${user.smsBalance}. Step marked as pending.`
        );
        await log.update({ status: "pending", executedAt: now });
        return { executed: false, ready: true }; // return early
      }


      const smsRecord = await SendSms.create(
        {
          userId,
          leadId: log.leadId,
          quoteId: null,
          recipientPhone: lead.phone,
          smsMessage: message,
          smsTemplateId: configObj.smsTemplateId || null,
          senderName: sender || 'NaviLead',
        },
      );

      const smsResponse = await sendSms({
        to: lead.phone,
        message: message,
        from: (sender || 'NaviLead').substring(0, 10),
      });

      if (smsResponse && smsResponse) {
        await smsRecord.update(
          { spendCredits: smsResponse },
        );
      }

      // ---- DYNAMIC SEGMENT BASED DEDUCTION ----
      let segmentsUsed = 1;

      if (
        smsResponse &&
        smsResponse.usage &&
        smsResponse.usage.countries
      ) {
        const countries = smsResponse.usage.countries;

        // Sum all SMS segment counts dynamically
        segmentsUsed = Object.values(countries).reduce(
          (sum, val) => sum + val,
          0
        );
      }

      console.log(`📩 Total Segments Used: ${segmentsUsed}`);

      // Deduct segments from balance
      const newBalance = user.smsBalance - segmentsUsed;
      await db.User.update(
        { smsBalance: newBalance },
        { where: { id: userId } }
      );

      console.log(`📱 Step ${log.orderNo} sendSms executed for lead ${log.leadId}`);
      console.log(`💰 Deducted ${segmentsUsed} SMS credits from user ${userId}. New balance: ${newBalance}`);

    } else {
      console.log(`📵 SMS notifications are disabled for user ${user.id}. Skipping SMS.`);
    }
  }


  // ----------------------------
  // UPDATE STATUS
  // ----------------------------
  if (fullStep.type === "updateStatus") {
    console.log(`⏱ Evaluating updateStatus for step order ${log.orderNo} with config:`, fullStep.config);

    if (configObj.statusId) {
      await db.Lead.update(
        { statusId: configObj.statusId },
        { where: { id: log.leadId } }
      );
    }
    console.log(`🔄 Step ${log.orderNo} updateStatus executed for lead ${log.leadId}`);
  }

  // ----------------------------
  // CONDITION
  // ----------------------------
  if (fullStep.type === "condition") {
    console.log(`⏱ Evaluating condition for step order ${log.orderNo} with config:`, fullStep.config);

    const {
      field,
      value: frontValue,
      operator,
      ifTrueAction,
      ifFalseAction,
      jumpToTrueOrder,
      jumpToFalseOrder,
    } = configObj;

    if (field === "leadValue" || field === "leadSource" || field === "email" || field === "phone" || field === "companyName" || field === "status" || field === "tags") {
      let sequelizeOperator;
      let valueToCompare = frontValue;

      switch (operator) {
        case "equals":
          sequelizeOperator = Op.eq;
          break;
        case "notEquals":
          sequelizeOperator = Op.ne;
          break;
        case "contains":
          sequelizeOperator = Op.like;
          valueToCompare = `%${frontValue}%`;
          break;
        case "greaterThan":
          sequelizeOperator = Op.gt;
          break;
        case "lessThan":
          sequelizeOperator = Op.lt;
          break;
        default:
          sequelizeOperator = Op.eq;
      }

      let dbField = field;

      // Map frontend field → DB column
      if (field === "leadValue") {
        dbField = "value";
      }

      if (field === "status") {
        dbField = "statusId";
      }

      let leads = [];

      if (field === "tags") {

        const frontTags = frontValue
          .split(",")
          .map(t => t.trim())
          .filter(Boolean);

        const allLeads = await db.Lead.findAll({
          where: { userId: log.userId }
        });

        leads = allLeads.filter(lead => {
          if (!lead.tags) return false;

          let leadTags = [];

          try {
            leadTags = typeof lead.tags === "string"
              ? JSON.parse(lead.tags)
              : lead.tags;
          } catch {
            return false;
          }

          switch (operator) {
            case "equals":
              return frontTags.every(tag => leadTags.includes(tag));

            case "notEquals":
              return !frontTags.every(tag => leadTags.includes(tag));

            case "contains":
              return frontTags.some(tag => leadTags.includes(tag));

            default:
              return false;
          }
        });

        console.log("Matching Leads:", leads.map(l => l.id));


      } else {
        // Check condition against leads
        leads = await db.Lead.findAll({
          where: {
            userId: log.userId,
            [dbField]: { [sequelizeOperator]: valueToCompare },
          },
        });

      }

      const conditionPassed = leads.length > 0;

      if (conditionPassed) {
        switch (ifTrueAction) {
          case "continue":
            console.log("➡️ Continue (no jump)");
            break;
          case "end":
            await endWorkflow(log.workflowId, log.leadId);
            break;
          case "jump":
            await executeNextStep(jumpToTrueOrder, log.leadId, log.workflowId);
            break;
        }
      } else {
        switch (ifFalseAction) {
          case "continue":
            console.log("➡️ Continue (no jump)");
            break;
          case "end":
            await endWorkflow(log.workflowId, log.leadId);
            break;
          case "jump":
            await executeNextStep(jumpToFalseOrder, log.leadId, log.workflowId);
            break;
        }
      }
    }

  }

  // Finally, mark step as done
  await log.update({ status: "done", executedAt: now });
  console.log(`✅ Step ${log.orderNo} executed for lead ${log.leadId}`);
}



const getSmsSegments = (message) => {
  const charsPerSegment = 160;
  const length = message.length;
  const segments = Math.ceil(length / charsPerSegment);
  return { length, segments };
};

module.exports = { runWorkflows, executeWorkflowCron, executeSingleStep };
