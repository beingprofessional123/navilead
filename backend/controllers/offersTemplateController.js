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


exports.createTemplates = async (req, res) => {
  try {
    console.log("REQ.BODY:", req.body);

    const {
      title,
      description,
      htmlCode,
      type,
      companyName,
      aboutUsDescription,
      mainBgColor,
      leftCardBgColor,
      rightCardBgColor,
      textColor,
      subTextColor,
      companyLogoUrl,
      aboutUsLogoUrl,
      status,
    } = req.body;

    // Handle uploaded files (if any)
    let companyLogo = null;
    let aboutUsLogo = null;

    if (req.files) {
      if (req.files.companyLogo && req.files.companyLogo[0]) {
        companyLogo = `${process.env.BACKEND_URL}/uploads/${req.files.companyLogo[0].filename}`;
      }

      if (req.files.aboutUsLogo && req.files.aboutUsLogo[0]) {
        aboutUsLogo = `${process.env.BACKEND_URL}/uploads/${req.files.aboutUsLogo[0].filename}`;
      }
    }

    // Fallback to provided URLs (when copying templates)
    if (!companyLogo && companyLogoUrl) {
      companyLogo = companyLogoUrl;
    }

    if (!aboutUsLogo && aboutUsLogoUrl) {
      aboutUsLogo = aboutUsLogoUrl;
    }

    // Create new offer template
    const newTemplate = await OfferTemplate.create({
      title: title || "Untitled Template",
      description: description || null,
      htmlCode: htmlCode || null,
      type: type || "Default",
      companyName: companyName || null,
      companyLogo: companyLogo || null,
      aboutUsLogo: aboutUsLogo || null,
      aboutUsDescription: aboutUsDescription || null,
      mainBgColor: mainBgColor || "#ffffff",
      leftCardBgColor: leftCardBgColor || "#ffffff",
      rightCardBgColor: rightCardBgColor || "#ffffff",
      textColor: textColor || "#000000",
      subTextColor: subTextColor || "#666666",
      userId: req.user.id,
      status: status || null,
    });

    return res.status(201).json({
      message: "Offer template created successfully!",
      template: newTemplate,
    });
  } catch (error) {
    console.error("Error creating offer template:", error);
    return res.status(500).json({ message: "Internal server error." });
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

    // Destructure type and other fields from request body
    const { type } = req.body;

    if (type === 'Custom') {
      const { htmlCode, title, description } = req.body;
      let updateData = { type, htmlCode, title, description };
      await template.update(updateData);
      return res.json({ message: "Custom Template updated successfully", template });
    }

    if (type === 'Default') {
      const { title, description, companyName, aboutUsDescription, mainBgColor, leftCardBgColor, rightCardBgColor, textColor, subTextColor, htmlCode, customHtml } = req.body;
      let updateData = { title, description, companyName, aboutUsDescription, mainBgColor, leftCardBgColor, rightCardBgColor, textColor, subTextColor, htmlCode, customHtml };

      // Check for new files and update the paths
      if (req.files && req.files['companyLogo']) {
        updateData.companyLogo = `${BACKEND_URL}/${req.files['companyLogo'][0].path.replace(/\\/g, "/")}`;
      }
      if (req.files && req.files['aboutUsLogo']) {
        updateData.aboutUsLogo = `${BACKEND_URL}/${req.files['aboutUsLogo'][0].path.replace(/\\/g, "/")}`;
      }

      await template.update(updateData);
      return res.json({ message: "Default Template updated successfully", template });
    }

    return res.status(400).json({ message: "Invalid template type" });

  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ message: "Failed to update template" });
  }
};


exports.getTemplateById = async (req, res) => {
  const { id } = req.params;
  try {
    const template = await OfferTemplate.findByPk(id); // Sequelize example
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // assuming you have user info in req.user

  try {
    // 1️⃣ Find the template to delete
    const template = await OfferTemplate.findOne({ where: { id, userId } });
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // 2️⃣ Count active templates for this user
    const activeCount = await OfferTemplate.count({
      where: { userId, status: 'active' }
    });

    // 3️⃣ Delete the template
    await template.destroy();

    // 4️⃣ If no active templates left, activate a default one
    if (activeCount === 1 && template.status === 'active') {
      // This means we just deleted the only active template
      const defaultTemplate = await OfferTemplate.findOne({
        where: { userId, type: 'Default' }
      });

      if (defaultTemplate) {
        await defaultTemplate.update({ status: 'active' });
      }
    }

    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.markAsDefault = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 1️⃣ Set all templates for this user to inactive
        await OfferTemplate.update(
            { status: 'inactive' },
            { where: { userId } }
        );

        // 2️⃣ Set selected template as active
        await OfferTemplate.update(
            { status: 'active' },
            { where: { id, userId } }
        );

        return res.status(200).json({ message: 'Template marked as active successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

