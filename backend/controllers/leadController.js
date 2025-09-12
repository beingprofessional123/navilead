require('dotenv').config();
const db = require("../models");
const { Lead, Status, User, ApiLog, Settings } = db;
const { Op } = require("sequelize");
const { runWorkflows } = require('../utils/runWorkflows');

const BACKEND_URL = process.env.BACKEND_URL;

// Helper to generate unique leadNumber incrementally
const generateLeadNumber = async () => {
  const lastLead = await Lead.findOne({ order: [["createdAt", "DESC"]] });
  if (!lastLead || !lastLead.leadNumber) return "#LEAD1001";
  const lastNumber = parseInt(lastLead.leadNumber.replace(/\D/g, ""), 10);
  return `#LEAD${lastNumber + 1}`;
};

// Helper to get Pending statusId dynamically
const getPendingStatusId = async () => {
  const pendingStatus = await Status.findOne({
    where: { name: "New", statusFor: "Lead" }
  });
  return pendingStatus ? pendingStatus.id : null;
};
const getQualifiedStatusId = async () => {
  const qualifiedStatus = await Status.findOne({
    where: { name: "Qualified", statusFor: "Lead" }
  });
  return qualifiedStatus ? qualifiedStatus.id : null;
};

const sanitizeToNull = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "null" ||
    value === "Invalid date"
  ) {
    return null;
  }
  return value;
};

const sanitizeToNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "null"
  ) {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
};


// Create lead
exports.createLead = async (req, res) => {
  try {
    // Generate unique lead number
    const leadNumber = await generateLeadNumber();

    // Get statusId: from request or default to Pending status
    const statusIdFromReq = req.body.statusId;
    const statusId = statusIdFromReq || (await getPendingStatusId());
    if (!statusId) {
      return res.status(400).json({ message: "api.leads.pendingStatusNotFound" });
    }

    // Process attachments if any, add full URL for frontend
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `${BACKEND_URL}/${file.path.replace(/\\/g, "/")}`, // ensure forward slashes
      }));
    }

    let followUpDate = req.body.followUpDate;
    if (!followUpDate || followUpDate === "" || followUpDate === "Invalid date") {
      followUpDate = null;
    }

    // Build lead data object
    const leadData = {
      fullName: sanitizeToNull(req.body.fullName),
      attName: sanitizeToNull(req.body.attName),
      phone: sanitizeToNull(req.body.phone),
      email: sanitizeToNull(req.body.email),
      address: sanitizeToNull(req.body.address),
      companyName: sanitizeToNull(req.body.companyName),
      cvrNumber: sanitizeToNull(req.body.cvrNumber),
      leadSource: sanitizeToNull(req.body.leadSource),
      internalNote: sanitizeToNull(req.body.internalNote),
      customerComment: sanitizeToNull(req.body.customerComment),
      tags: req.body.tags || [],
      value: sanitizeToNumber(req.body.value),  // ✅ fix here
      reminderTime: sanitizeToNull(req.body.reminderTime),

      followUpDate,
      leadNumber,
      userId: req.user.id,
      statusId,
      attachments,
    };

    const lead = await Lead.create(leadData);

    // // --- 📌 Create Workflow Logs (all steps as pending) ---
    // const workflows = await db.Workflow.findAll({
    //   where: { triggerEvent: "newLeadCreated", isActive: true, userId: req.user.id },
    //   include: [{ model: db.WorkflowStep, as: "steps" }],
    // });

    // for (const workflow of workflows) {
    //   for (const step of workflow.steps) {
    //     await db.WorkflowLog.create({
    //       userId: req.user.id,
    //       workflowId: workflow.id,
    //       leadId: lead.id,
    //       stepId: step.id,
    //       orderNo: step.order,
    //       status: "pending",
    //       executedAt: null,
    //     });
    //   }
    // }
    
    await runWorkflows("newLeadCreated", { lead, user: req.user });
    res.status(201).json({ message: "api.leads.createSuccess", lead });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "api.leads.createError", error: err.message });
  }
};

// Update lead
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!lead) {
      return res.status(404).json({ message: "api.leads.notAuthorized" });
    }

    // Start with existing attachments
    let newAttachments = lead.attachments || [];

    // Remove attachments if they are listed in removedAttachments
    if (req.body.removedAttachments) {
      const removed = Array.isArray(req.body.removedAttachments)
        ? req.body.removedAttachments
        : [req.body.removedAttachments];

      newAttachments = newAttachments.filter(
        (att) => !removed.includes(att.filename)
      );
    }

    // Add newly uploaded files
    if (req.files && req.files.length > 0) {
      const uploaded = req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `${BACKEND_URL}/${file.path.replace(/\\/g, "/")}`,
      }));
      newAttachments = [...newAttachments, ...uploaded];
    }

    let statusId = req.body.statusId || lead.statusId;
    if (req.body.status === "Qualified") {
      statusId = await getQualifiedStatusId();
    }


    let followUpDate = req.body.followUpDate;
    if (!followUpDate || followUpDate === "" || followUpDate === "Invalid date") {
      followUpDate = null;
    }

    let notifyOnFollowUp = req.body.notifyOnFollowUp;
    if (notifyOnFollowUp === "null" || notifyOnFollowUp === "" || notifyOnFollowUp === undefined) {
      notifyOnFollowUp = null; // goes to DB as NULL
    } else if (notifyOnFollowUp === "true" || notifyOnFollowUp === true) {
      notifyOnFollowUp = true;
    } else if (notifyOnFollowUp === "false" || notifyOnFollowUp === false) {
      notifyOnFollowUp = false;
    }

     let value = req.body.value;
    if (value === "" || value === null || value === undefined) {
      value = null;
    } else {
      value = parseFloat(value);
      if (isNaN(value)) value = null; // safeguard
    }

    const updateData = {
      ...req.body,
      followUpDate,
      notifyOnFollowUp,
      attachments: newAttachments,
      statusId,
      value
    };

    await Lead.update(updateData, {
      where: { id: req.params.id, userId: req.user.id },
    });

    // ✅ Run "leadStatusChanged" ONLY if status actually changed
    if (lead.statusId !== statusId) {
      await runWorkflows("leadStatusChanged", { lead, user: req.user });
    }

    await runWorkflows("leadUpdated", { lead, user: req.user });
    const updatedLead = await Lead.findOne({
      where: { id: req.params.id },
      include: [{ model: Status, as: "status" }],
    });
    res.json({ message: "api.leads.updateSuccess", updatedLead });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "api.leads.updateError", error: err.message });
  }
};


// Get all leads for authenticated user
exports.getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.findAll({
      where: { userId: req.user.id },
      include: [{ model: Status, as: "status" }],
      order: [["createdAt", "DESC"]],
    });
    res.json(leads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "api.leads.fetchError", error: err.message });
  }
};

// Get a single lead by ID
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Status, as: "status" }],
    });
    if (!lead) {
      return res.status(404).json({ message: "api.leads.notFound" });
    }
    res.json(lead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "api.leads.fetchError", error: err.message });
  }
};

// Delete a lead by ID
exports.deleteLead = async (req, res) => {
  try {
    const deleted = await Lead.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted) {
      return res.status(404).json({ message: "api.leads.notAuthorized" });
    }
    res.json({ message: "api.leads.deleteSuccess" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "api.leads.deleteError", error: err.message });
  }
};

// Main controller function
exports.createPublicLead = async (req, res) => {
  try {
    // Determine data source based on request method
    const data = req.method === "GET" ? req.query : req.body;
    const apikey = req.headers["x-api-key"] || req.query.apikey;

    // Prevent GET with file uploads
    if (req.method === "GET" && req.body && data.attachments) {
      return res.status(400).json({
        success: false,
        message: "Attachments are not allowed with GET method.",
      });
    }

    // Validation functions
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    const isValidPhone = (phone) => /^[0-9+\-\s]{6,20}$/.test(phone);
    const isValidCVR = (cvr) => /^[0-9]{8}$/.test(cvr);

    // --- Authentication ---
    let user;
    if (apikey) {
      user = await User.findOne({
        where: {
          apikey
        }
      });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid API key. Please provide a valid key in the header (x-api-key) or URL query (?apikey=).",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Authentication required. Pass the API key in the header (x-api-key) or as a query parameter (?apikey=).",
      });
    }

    // --- Required fields ---
    if (!data.fullName || data.fullName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    // --- Optional field validation ---
    if (data.email && !isValidEmail(data.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }
    if (data.phone && !isValidPhone(data.phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format.",
      });
    }
    if (data.cvrNumber && !isValidCVR(data.cvrNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid CVR number (must be 8 digits).",
      });
    }

    const allowedLeadSources = [
      "Facebook Ads", "Google Ads", "Website Form", "Phone Call",
      "Email", "Referral", "LinkedIn", "Trade Show",
      "Cold Outreach", "Zapier", "WordPress", "API", "Other",
    ];
    if (data.leadSource && !allowedLeadSources.includes(data.leadSource)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead source provided.",
        allowedLeadSources: allowedLeadSources,
      });
    }

    // --- Daily API Limit Check ---

    // Get the daily limit from the settings table.
    const dailyLimitSetting = await Settings.findOne({
      where: {
        key: "api_Daily_limit"
      },
    });
    const dailyLimit = dailyLimitSetting ? Number(dailyLimitSetting.value) : 5;

    // Get the start and end of the current day.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Count API hits for the current user today.
    const hitCount = await ApiLog.count({
      where: {
        userId: user.id,
        createdAt: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });

    if (hitCount >= dailyLimit) {
      return res.status(429).json({
        success: false,
        message: "Daily API request limit reached.",
      });
    }

    // --- Duplicate Lead Check ---
    const duplicateConditions = [];
    if (data.email) {
      duplicateConditions.push({
        email: data.email.trim().toLowerCase()
      });
    }
    if (data.phone) {
      duplicateConditions.push({
        phone: data.phone.trim()
      });
    }
    if (data.fullName && data.companyName) {
      duplicateConditions.push({
        fullName: data.fullName.trim(),
        companyName: data.companyName.trim(),
      });
    }

    let existingLead = null;
    if (duplicateConditions.length > 0) {
      existingLead = await Lead.findOne({
        where: {
          userId: user.id,
          [Op.or]: duplicateConditions,
        },
      });
    }

    if (existingLead) {
      const existingStatus = await Status.findByPk(existingLead.statusId);
      return res.status(409).json({
        success: false,
        message: "Duplicate lead already exists.",
        lead: {
          ...existingLead.toJSON(),
          status: existingStatus ? existingStatus.name : null,
        },
      });
    }

    // --- Prepare Data for New Lead ---
    const statusId = await getPendingStatusId();
    if (!statusId) {
      return res.status(400).json({
        success: false,
        message: "Default pending status not found.",
      });
    }

    let followUpDate = null;
    if (data.followUpDate) {
      const date = new Date(data.followUpDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid follow-up date.",
        });
      }
      followUpDate = date;
    }

    const notifyOnFollowUp = data.notifyOnFollowUp === "true";

    let tags = null;
    if (data.tags && typeof data.tags === "string") {
      tags = data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }

    const value = data.value ? Number(data.value) : null;
    if (data.value && isNaN(value)) {
      return res.status(400).json({
        success: false,
        message: "Value must be a number.",
      });
    }

    const leadNumber = await generateLeadNumber();

    let attachments = [];
    if (req.method === "POST" && req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `${BACKEND_URL}/${file.path.replace(/\\/g, "/")}`,
      }));
    }

    const status = await Status.findByPk(statusId);

    // --- Create New API Log Entry ---
    await ApiLog.create({
      userId: user.id,
      url: req.originalUrl,
    });

    // --- Create New Lead ---
    const lead = await Lead.create({
      userId: user.id,
      leadNumber,
      fullName: data.fullName.trim(),
      attName: data.attName || "",
      phone: data.phone || "",
      email: data.email ? data.email.toLowerCase() : "",
      address: data.address || "",
      companyName: data.companyName || "",
      cvrNumber: data.cvrNumber || "",
      leadSource: data.leadSource || "",
      tags,
      internalNote: data.internalNote || "",
      customerComment: data.customerComment || "",
      followUpDate,
      notifyOnFollowUp,
      attachments,
      statusId,
      value,
    });


    if (data.leadSource === 'API') {
      await runWorkflows("leadCreatedViaAPI", { lead, user });
    } else if (data.leadSource === 'Website Form') {
      await runWorkflows("leadCreatedViaWebsite", { lead, user });
    } else if (data.leadSource === 'Facebook Ads') {
      await runWorkflows("leadCreatedViaFacebook", { lead, user });
    }



      return res.status(201).json({
        success: true,
        message: "Lead created successfully.",
        lead: {
          ...lead.toJSON(),
          status: status ? status.name : null,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while creating the lead.",
        error: err.message,
      });
    }
  };