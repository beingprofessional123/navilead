require('dotenv').config();
const db = require("../models");
const { Lead, Status, User } = db;

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
    where: { name: "Sent", statusFor: "Lead" }
  });
  return pendingStatus ? pendingStatus.id : null;
};
const getQualifiedStatusId = async () => {
  const qualifiedStatus = await Status.findOne({
    where: { name: "Qualified", statusFor: "Lead" }
  });
  return qualifiedStatus ? qualifiedStatus.id : null;
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

    // Build lead data object
    const leadData = {
      ...req.body,
      leadNumber,
      userId: req.user.id,
      statusId,
      attachments,
    };

    const lead = await Lead.create(leadData);
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

    const updateData = {
      ...req.body,
      attachments: newAttachments,
      statusId,
    };

    await Lead.update(updateData, {
      where: { id: req.params.id, userId: req.user.id },
    });

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


exports.createPublicLead = async (req, res) => {
  try {
    const query = req.query;
    const data = req.method === "GET" ? req.query : req.body;

    if (req.method === "GET" && req.body && req.body.attachments) {
      return res.status(400).json({
        success: false,
        message: "api.leads.publicLeadAttachmentsGetMethod"
      });
    }


    // Extract userId
    const userId = query.userId;
    const email = query.email;

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    const isValidPhone = (phone) => /^[0-9+\-\s]{6,20}$/.test(phone);
    const isValidCVR = (cvr) => /^[0-9]{8}$/.test(cvr);

     if (!userId) {
      return res.status(400).json({ success: false, message: "api.leads.publicLeadUserIdRequired" });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "api.leads.publicLeadInvalidEmail" });
    }

    // Determine user
    let user;
    if (userId) {
      user = await User.findByPk(userId);
      if (!user) {
        return res.status(400).json({ success: false, message: "api.leads.publicLeadUserNotFound" });
      }
    }

    // Validate required lead fields
    if (!query.fullName || query.fullName.trim() === "") {
      return res.status(400).json({ success: false, message: "api.leads.publicLeadFullNameRequired" });
    }
    if (!query.phone || !isValidPhone(query.phone)) {
      return res.status(400).json({ success: false, message: "api.leads.publicLeadPhoneRequired" });
    }
    if (!query.companyName || query.companyName.trim() === "") {
      return res.status(400).json({ success: false, message: "api.leads.publicLeadCompanyNameRequired" });
    }

    const allowedLeadSources = [
      "Facebook Ads",
      "Google Ads",
      "Website Form",
      "Phone Call",
      "Email",
      "Referral",
      "LinkedIn",
      "Trade Show",
      "Cold Outreach",
      "Other",
    ];

    if (query.leadSource && !allowedLeadSources.includes(query.leadSource)) {
      return res.status(400).json({
        success: false,
        message: "api.leads.publicLeadInvalidSource",
      });
    }

    // Check for duplicate lead
    const existingLead = await Lead.findOne({
      where: {
        userId: user.id,
        fullName: query.fullName ? query.fullName.trim() : null,
        attName: query.attName ? query.attName.trim() : null,
        phone: query.phone ? query.phone.trim() : null,
        email: query.email ? query.email.trim().toLowerCase() : null,
        companyName: query.companyName ? query.companyName.trim() : null,
        cvrNumber: query.cvrNumber ? query.cvrNumber.trim() : null,
        leadSource: query.leadSource ? query.leadSource.trim() : null,
      },
    });


    if (existingLead) {
      const existingStatus = await Status.findByPk(existingLead.statusId);

      return res.status(409).json({
        success: false,
        message: "api.leads.publicLeadDuplicate",
        lead: {
          ...existingLead.toJSON(),
          status: existingStatus ? existingStatus.name : null,  // replace statusId with status name
        }
      });
    }

    // Default status
    const statusId = await getPendingStatusId();
    if (!statusId) {
      return res.status(400).json({ success: false, message: "api.leads.publicLeadDefaultStatusNotFound" });
    }

    // Optional fields validation
    let followUpDate = null;
    if (query.followUpDate) {
      const date = new Date(query.followUpDate);
      if (isNaN(date.getTime())) return res.status(400).json({ success: false, message: "api.leads.publicLeadInvalidFollowUpDate" });
      followUpDate = date;
    }

    const notifyOnFollowUp = query.notifyOnFollowUp === "true";

    let tags = null;
    if (query.tags && typeof query.tags === "string") {
      tags = query.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    const value = query.value ? Number(query.value) : null;
    if (query.value && isNaN(value)) return res.status(400).json({ success: false, message: "api.leads.publicLeadValueNotNumber" });

    // Generate lead number
    const leadNumber = await generateLeadNumber();

    // Handle attachments only if POST (files uploaded)
    let attachments = [];
    if (req.method === "POST" && req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `${BACKEND_URL}/${file.path.replace(/\\/g, "/")}`, // ensure forward slashes
      }));
    }


    const status = await Status.findByPk(statusId);

    // Create new lead
    const newLead = await Lead.create({
      userId: user.id,
      leadNumber,
      fullName: query.fullName.trim(),
      attName: query.attName || "",
      phone: query.phone.trim(),
      email: email || "",
      address: query.address || "",
      companyName: query.companyName.trim(),
      cvrNumber: query.cvrNumber || "",
      leadSource: query.leadSource || "",
      tags,
      internalNote: query.internalNote || "",
      customerComment: query.customerComment || "",
      followUpDate,
      notifyOnFollowUp,
      attachments,
      statusId,
      value,
    });

    return res.status(201).json({
      success: true,
      message: "api.leads.publicLeadCreateSuccess",
      lead: {
        ...newLead.toJSON(),
        status: status ? status.name : null,  // replace statusId with status name
      },
    });


  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
