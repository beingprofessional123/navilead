const multer = require('multer');
const path = require('path');
const { User, sequelize } = require('../models');
const BACKEND_URL = process.env.BACKEND_URL;

// -------------------------
// Multer config for logo uploads
// -------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${req.user.id}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

exports.uploadMiddleware = upload.single('logo');

// -------------------------
// Get all user settings
// -------------------------
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'companyName',
        'email',
        'phone',
        'websiteUrl',
        'timezone',
        'currency',
        'language',
        'emailSignature',
        'companyLogo'
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching settings.',
      error: error.message
    });
  }
};

// -------------------------
// Update general settings
// -------------------------
exports.updateGeneralSettings = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      companyName,
      email,
      phone,
      websiteUrl,
      timezone,
      currency,
      language,
      emailSignature
    } = req.body;

    // Build update object dynamically (only include provided fields)
    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (currency !== undefined) updateData.currency = currency;
    if (language !== undefined) updateData.language = language;
    if (emailSignature !== undefined) updateData.emailSignature = emailSignature;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update." });
    }

    await User.update(updateData, {
      where: { id: req.user.id },
      transaction: t
    });

    await t.commit();
    res.status(200).json({ message: "Settings updated successfully." });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Error updating settings.",
      error: error.message
    });
  }
};


// -------------------------
// Upload company logo
// -------------------------
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Build full URL
    const filePath = `/uploads/${req.file.filename}`;
    const fileUrl = `${BACKEND_URL}${filePath.replace(/\\/g, "/")}`;

    // Store full URL in DB
    await User.update(
      { companyLogo: fileUrl },
      { where: { id: req.user.id } }
    );

    res.status(200).json({
      message: "Logo uploaded successfully.",
      fileUrl, // Full URL stored and returned
    });
  } catch (error) {
    res.status(500).json({
      message: "Error uploading logo.",
      error: error.message,
    });
  }
};


// -------------------------
// Remove company logo
// -------------------------
exports.removeLogo = async (req, res) => {
  try {
    await User.update(
      { companyLogo: null },
      { where: { id: req.user.id } }
    );
    res.status(200).json({ message: 'Logo removed successfully.' });
  } catch (error) {
    res.status(500).json({
      message: 'Error removing logo.',
      error: error.message
    });
  }
};

// -------------------------
// Invite user (mock)
// -------------------------
exports.inviteUser = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`User invitation sent to: ${email}`);
    res
      .status(200)
      .json({ message: `Invitation sent to ${email} successfully.` });
  } catch (error) {
    res.status(500).json({
      message: 'Error inviting user.',
      error: error.message
    });
  }
};


exports.updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({ message: "Language is required" });
    }

    await User.update(
      { language }, // column in DB
      { where: { id: req.user.id } } // current logged-in user
    );

    res.status(200).json({ success: true, message: "Language updated", language });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating language", error: error.message });
  }
};