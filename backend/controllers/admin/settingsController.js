const multer = require('multer');
const path = require('path');
const { User, Settings, sequelize } = require('../../models');
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
        'name',
        'email',
        'phone',
        'language',
        'companyLogo'
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      language: user.language,
      companyLogo: user.companyLogo,
      createdAt: user.createdAt,
    };

    res.status(200).json({ user: userData });
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
    const { email, phone, language, name } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (language !== undefined) updateData.language = language;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update." });
    }

    await User.update(updateData, {
      where: { id: req.user.id },
      transaction: t
    });

    const updatedUser = await User.findByPk(req.user.id, { transaction: t });

    await t.commit();
    res.status(200).json({ message: "Settings updated successfully.", user: updatedUser });
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

// -------------------------
// Change Password
// -------------------------
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirmation do not match." });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check current password (assuming bcrypt)
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update in DB
    await User.update(
      { password: hashedPassword },
      { where: { id: req.user.id } }
    );

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Error changing password.",
      error: error.message
    });
  }
};

