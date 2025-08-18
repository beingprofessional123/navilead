require('dotenv').config();
const db = require("../models");
const { Lead, Status } = db;

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
      return res.status(400).json({ message: "Pending status not found in DB" });
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
    res.status(201).json(lead);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error creating lead", error: err.message });
  }
};

// Update lead
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!lead) return res.status(404).json({ message: "Lead not found or not authorized" });

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
    res.json(updatedLead);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error updating lead", error: err.message });
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
    res.status(500).json({ message: "Error fetching leads", error: err.message });
  }
};

// Get a single lead by ID
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Status, as: "status" }],
    });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching lead", error: err.message });
  }
};

// Delete a lead by ID
exports.deleteLead = async (req, res) => {
  try {
    const deleted = await Lead.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted) return res.status(404).json({ message: "Lead not found or not authorized" });
    res.json({ message: "Lead deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting lead", error: err.message });
  }
};
