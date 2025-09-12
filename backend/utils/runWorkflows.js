// utils/workflowRunner.js
const db = require("../models");
const { sendMail } = require("../utils/mail");
const { sendSms } = require("../utils/sms");
const { htmlToText } = require("html-to-text"); // optional, for text fallback
const UserVariable = db.UserVariable;
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

/**
* Replace variables like {{first_name}} in text
*/

function replaceVariables(text, variablesMap) {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
    variablesMap[varName] !== undefined ? variablesMap[varName] : match
  );
}



/**
* Convert delay + unit to milliseconds
*/

function delayToMs(delay = 0, unit = "minutes") {
  delay = Number(delay) || 0;
  switch (unit) {
    case "hours":
      return delay * 60 * 60 * 1000;
    case "days":
      return delay * 24 * 60 * 60 * 1000;
    default:
      return delay * 60 * 1000; // minutes
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
  // WAIT DELAY
  if (stepRow.type === "waitDelay") {
    const delayMs = delayToMs(configObj.delay, configObj.unit);
    const base = baseTime ? new Date(baseTime) : new Date(logRow.createdAt); // fallback
    if (now - base < delayMs) {
      // Not ready yet
      return { executed: false, ready: false };
    }
    // Delay satisfied -> mark done
    await logRow.update({ status: "done", executedAt: now });
    console.log(`⏳ WaitDelay step (order ${logRow.orderNo}) completed for lead ${logRow.leadId}`);
    return { executed: true, ready: true };
  }

  // SEND EMAIL
  if (stepRow.type === "sendEmail") {
    const lead = await db.Lead.findByPk(logRow.leadId);
    if (!lead?.email) {
      // Nothing to do but mark as done (or you may prefer to mark error)
      await logRow.update({ status: "done", executedAt: now });
      console.warn(`No email for lead ${logRow.leadId} — marking sendEmail done`);
      return { executed: true, ready: true };
    }

    let subject = configObj.subject || "Welcome!";
    let text = configObj.body || "Thanks for creating a lead.";
    let html = null;
    let cc = null;
    let attachments = null;



    if (configObj.emailTemplateId) {
      const template = await db.EmailTemplate.findByPk(configObj.emailTemplateId);
      if (template) {
        subject = template.subject;
        html = template.emailContent; // HTML version
        text = htmlToText(html); // Convert HTML to text for fallback
        cc = template.ccEmails ? template.ccEmails.split(",") : null;
        attachments = template.attachments || null;
      } else {
        console.warn(`⚠️ Email template ${configObj.emailTemplateId} not found`);
      }
    }

    subject = replaceVariables(subject, variablesMap);
    text = replaceVariables(text, variablesMap);
    if (html) html = replaceVariables(html, variablesMap);

    await sendMail({
      to: lead.email,
      subject,
      text,
      html,
      cc,
      attachments,
    });
    console.log(`📩 Sending email to ${lead.email} (${logRow.leadId}) subject: ${subject}`);


    await logRow.update({ status: "done", executedAt: now });
    return { executed: true, ready: true };
  }



  // SEND SMS
  if (stepRow.type === "sendSms") {
    const lead = await db.Lead.findByPk(logRow.leadId);
    if (!lead?.phone) {
      await logRow.update({ status: "done", executedAt: now });
      console.warn(`No phone for lead ${logRow.leadId} — marking sendSms done`);
      return { executed: true, ready: true };
    }

    let message = configObj.message || "Thanks for creating a lead.";
    let sender = (configObj.sender || "NaviLead").substring(0, 11);

    if (configObj.smsTemplateId) {
      const template = await db.SmsTemplate.findByPk(configObj.smsTemplateId);
      if (template) {
        message = template.smsContent;
      } else {
        console.warn(`⚠️ SMS template ${configObj.smsTemplateId} not found`);
      }
    }

    message = replaceVariables(message, variablesMap);

    await sendSms({
      to: lead.phone,
      message,
      from: sender,
    });
    console.log(`📱 Sending SMS to ${lead.phone} (${logRow.leadId}) message: ${message}`);

    await logRow.update({ status: "done", executedAt: now });
    return { executed: true, ready: true };
  }



  // UPDATE STATUS
  if (stepRow.type === "updateStatus") {
    if (!configObj.statusId) {
      await logRow.update({ status: "done", executedAt: now });
      return { executed: true, ready: true };
    }

    console.log(`🔄 Updating lead ${logRow.leadId} status -> ${configObj.statusId}`);
    await db.Lead.update({ statusId: configObj.statusId }, { where: { id: logRow.leadId } });
    await logRow.update({ status: "done", executedAt: now });
    return { executed: true, ready: true };
  }



  // Unknown step type: mark done to avoid blocking
  await logRow.update({ status: "done", executedAt: now });
  console.warn(`Unknown step type "${stepRow.type}" - marked done for log ${logRow.id}`);
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
        // - else -> baseTime = executedAt of previous step (should be set because we proceed sequentially)

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
        // If executed, continue to the next step in same run
      } // end steps loop
    } // end workflows loop
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
  try {
    // Fetch all pending logs (no date filtering here so cron can resume older pending work too)
    const pendingLogs = await db.WorkflowLog.findAll({
      where: { status: "pending" },
      order: [["workflowId", "ASC"], ["leadId", "ASC"], ["orderNo", "ASC"]],
    });



    if (!pendingLogs.length) {
      console.log("No pending workflow logs.");
      if (res) return res.json({ message: "No pending workflow logs." });
      return;
    }



    // Group by workflowId + leadId
    const groups = {};
    for (const plog of pendingLogs) {
      const key = `${plog.workflowId}_${plog.leadId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(plog);
    }

    // Process each group's logs sequentially
    for (const key of Object.keys(groups)) {
      const logs = groups[key].sort((a, b) => a.orderNo - b.orderNo);

      // fetch lead for variable building and base times
      const leadId = logs[0].leadId;
      const lead = leadId ? await db.Lead.findByPk(leadId) : null;

      // create variables map from lead (you could add user vars too if needed)
      const variablesMap = {};
      if (lead) {
        Object.keys(lead.toJSON()).forEach((k) => (variablesMap[k] = lead[k]));
      }

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const step = await db.WorkflowStep.findByPk(log.stepId);
        if (!step) {
          console.warn("Missing workflow step for log", log.id);
          // mark done to prevent blocking? depend on domain. Here we mark done.
          await log.update({ status: "done", executedAt: new Date() });
          continue;
        }

        // Ensure previous is done (if exists)
        if (i > 0) {
          const prevLog = logs[i - 1];
          if (prevLog.status !== "done") {
            console.log(`Group ${key}: step ${log.orderNo} waiting for previous step ${prevLog.orderNo}.`);
            break; // wait until previous is done
          }
        }

        const configObj = parseConfig(step.config);

        // Determine baseTime:
        // - if i === 0 -> use lead.createdAt (preferred) else log.createdAt
        // - else -> prevLog.executedAt (or prevLog.createdAt fallback)

        let baseTime;
        if (i === 0) {
          baseTime = lead?.createdAt ? new Date(lead.createdAt) : new Date(log.createdAt);
        } else {
          const prevLog = logs[i - 1];
          baseTime = prevLog.executedAt ? new Date(prevLog.executedAt) : new Date(prevLog.createdAt);
        }

        const { executed, ready } = await executeSingleStep(log, step, configObj, variablesMap, baseTime);

        if (!executed) {
          // waitDelay not ready yet -> stop processing this group for now
          console.log(`Group ${key}: step ${log.orderNo} waitDelay not ready; will resume later.`);
          break;
        }
        // executed -> continue to next step in this group
      } // end group processing loop
    } // end groups loop
    console.log("Workflow cron run completed.");
    if (res) return res.json({ message: "Workflow cron executed successfully." });
  } catch (err) {
    console.error("❌ executeWorkflowCron failed:", err);
    if (res) return res.status(500).json({ message: "Workflow cron failed", error: err.message });
  }
}



module.exports = { runWorkflows, executeWorkflowCron };

