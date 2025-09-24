// controllers/offersTemplateController.js
const db = require('../models');
const OfferTemplate = db.OfferTemplate;
const BACKEND_URL = process.env.BACKEND_URL;
const path = require("path");

/**
 * Get all templates for the authenticated user
 */
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await OfferTemplate.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
};

/**
 * Update a template by ID
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await OfferTemplate.findOne({
      where: { id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const { title, companyName, aboutUsDescription, mainBgColor, leftCardBgColor, rightCardBgColor, textColor, subTextColor, htmlCode,customHtml } = req.body;
    let updateData = { title, companyName, aboutUsDescription, mainBgColor, leftCardBgColor, rightCardBgColor, textColor, subTextColor ,htmlCode,customHtml };

    // Check for new files and update the paths
    if (req.files && req.files['companyLogo']) {
      updateData.companyLogo = `${BACKEND_URL}/${req.files['companyLogo'][0].path.replace(/\\/g, "/")}`;
    }
    if (req.files && req.files['aboutUsLogo']) {
      updateData.aboutUsLogo = `${BACKEND_URL}/${req.files['aboutUsLogo'][0].path.replace(/\\/g, "/")}`;
    }

    await template.update(updateData);

    res.json({ message: "Template updated successfully", template });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ message: "Failed to update template" });
  }
};
