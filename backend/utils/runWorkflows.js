const db = require("../models");
const { sendMail } = require("../utils/mail");
const { sendSms } = require("../utils/sms");
const { htmlToText } = require("html-to-text");
const UserVariable = db.UserVariable;
const User = db.User;
const cronLog = db.cronLog;
const StatusUpdateLog = db.StatusUpdateLog;
const Settings = db.Settings;

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
function replaceVariables(text, variablesMap) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
    variablesMap[varName] !== undefined ? variablesMap[varName] : match
  );
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
      console.log(`⏳ Step ${logRow.orderNo} waitDelay not ready. Will execute at ${readyTime}`);
      return { executed: false, ready: false }; // cron will pick up later
    }

    // Delay complete
    await logRow.update({ status: "done", executedAt: now });
    console.log(`✅ Step ${logRow.orderNo} waitDelay executed at ${now}`);
    return { executed: true, ready: true };
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

    if (configObj.emailTemplateId) {
      const template = await db.EmailTemplate.findByPk(configObj.emailTemplateId);
      if (template) {
        subject = template.subject;
        html = template.emailContent;
        text = htmlToText(html);
        cc = template.ccEmails ? template.ccEmails.split(",") : null;
        attachments = template.attachments || null;
      }
    }

    subject = replaceVariables(subject, variablesMap);
    text = replaceVariables(text, variablesMap);
    if (html) html = replaceVariables(html, variablesMap);


    const emailSetting = await Settings.findOne({
      where: { userId: lead.userId, key: 'emailNotifications' },
    });


    if (emailSetting.value === 'true') {
      await sendMail({ to: lead.email, subject, text, html, cc, attachments });
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

    message = replaceVariables(message, variablesMap);

    const smsSetting = await Settings.findOne({
      where: { userId: user.id, key: 'smsNotifications' },
    });


    if (smsSetting.value === 'true') {
      await sendSms({ to: lead.phone, message, from: sender });
      console.log(`📱 Step ${logRow.orderNo} sendSms executed for lead ${logRow.leadId}`);

      await logRow.update({ status: "done", executedAt: now });

      await db.User.update(
        { smsBalance: user.smsBalance - 1 },
        { where: { id: userId } }
      );
      user.smsBalance -= 1;
      console.log(`💰 Deducted 1 SMS from user ${userId}. New balance: ${user.smsBalance}`);

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

  // unknown step type
  await logRow.update({ status: "done", executedAt: now });
  console.warn(`Unknown step type "${stepRow.type}" - marked done`);
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
    console.log("contextData".contextData);
    const workflows = await db.Workflow.findAll({
      where: { triggerEvent, isActive: true, userId: contextData.user?.id },
      include: [{ model: db.WorkflowStep, as: "steps" }],
    });

    if (!workflows.length) {
      console.log("⚡ No active workflows for", triggerEvent);
      return;
    }

    for (const workflow of workflows) {
      console.log(`⚡ Triggered workflow "${workflow.name}" for lead ${contextData.lead?.id}`);
      // order steps by their `order` field
      const steps = (workflow.steps || []).slice().sort((a, b) => a.order - b.order);

      // Build variables map from user vars + lead + extra
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

      // 1) Create WorkflowLog rows for ALL steps first (status = pending)
      const logs = [];
      for (const step of steps) {
        const createdLog = await db.WorkflowLog.create({
          userId: contextData.user?.id || null,
          workflowId: workflow.id,
          leadId: contextData.lead?.id || null,
          stepId: step.id,
          orderNo: step.order,
          status: "pending",
          executedAt: null,
        });
        logs.push({ log: createdLog, step });
      }

      // 2) Execute sequentially from step 1 onwards
      // baseTime for step1 is lead.createdAt (if it exists) otherwise the createdAt of log (fallback)
      let prevExecutedAt = contextData.lead?.createdAt ? new Date(contextData.lead.createdAt) : null;

      for (let i = 0; i < logs.length; i++) {
        const { log, step } = logs[i];
        const configObj = parseConfig(step.config);

        // Determine base time:
        // - if i === 0 -> baseTime = lead.createdAt OR log.createdAt
        // else -> baseTime = executedAt of previous step (should be set because we proceed sequentially)
        let baseTime;
        if (i === 0) {
          baseTime = prevExecutedAt || new Date(log.createdAt);
        } else {
          // previous step log row
          const prevLog = logs[i - 1].log;
          if (prevLog.status !== "done") {
            // previous wasn't done => stop here; cron will resume later
            console.log(`Sequential stop: previous step (order ${logs[i - 1].log.orderNo}) not done for lead ${log.leadId}`);
            break;
          }
          baseTime = prevLog.executedAt ? new Date(prevLog.executedAt) : new Date(prevLog.createdAt);
        }

        // Execute the step (for waitDelay it will check baseTime)
        const { executed, ready } = await executeSingleStep(log, step, configObj, variablesMap, baseTime);

        if (!executed) {
          // For waitDelay not ready: stop sequential processing — cron will pick up later
          console.log(`Step order ${log.orderNo} not ready yet (will resume by cron).`);
          break;
        }
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
async function executeWorkflowCron(req, res) {
  let cronLog = null;
  let processedLeadsCount = 0;
  let processedStepsCount = 0;


  try {
    cronLog = await db.CronLog.create({
      startedAt: new Date(),
      status: "started",
    });


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
              `⏱ Step waiting (waitDelay) | Order: ${log.orderNo} | Time passed: ${elapsedMinutes}m ${elapsedSeconds}s | Configured: ${fullStep.config.delay} ${fullStep.config.unit}`
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

            if (configObj.emailTemplateId) {
              const template = await db.EmailTemplate.findByPk(configObj.emailTemplateId);
              if (template) {
                subject = template.subject;
                html = template.emailContent;
                text = htmlToText(html);
                cc = template.ccEmails ? template.ccEmails.split(",") : null;
                attachments = template.attachments || null;
              }
            }

            subject = replaceVariables(subject, variablesMap);
            text = replaceVariables(text, variablesMap);
            if (html) html = replaceVariables(html, variablesMap);

            const emailSetting = await Settings.findOne({
              where: { userId: lead.userId, key: 'emailNotifications' },
            });


            if (emailSetting.value === 'true') {
              await sendMail({ to: lead.email, subject, text, html, cc, attachments });
              console.log(`📩 Step ${log.orderNo} sendEmail executed for lead ${lead.leadId}`);
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

            message = replaceVariables(message, variablesMap);


            const smsSetting = await Settings.findOne({
              where: { userId: user.id, key: 'smsNotifications' },
            });


            if (smsSetting.value === 'true') {
              await sendSms({ to: lead.phone, message, from: sender, userId: user.id });
              console.log(`📱 Step ${log.orderNo} sendSms executed for lead ${log.leadId}`);

              // Deduct 1 SMS from user balance
              await db.User.update(
                { smsBalance: user.smsBalance - 1 },
                { where: { id: userId } }
              );
              user.smsBalance -= 1;
              console.log(`💰 Deducted 1 SMS from user ${userId}. New balance: ${user.smsBalance}`);

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


module.exports = { runWorkflows, executeWorkflowCron, executeSingleStep };
