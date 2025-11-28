const multer = require('multer');
const path = require('path');
const { User,Settings,SmtpSetting,UserVariable, sequelize } = require('../models');
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
        'name',
        'email',
        'phone',
        'websiteUrl',
        'timezone',
        'currencyId',
        'language',
        'emailSignature',
        'apikey',
        'companyLogo',
        'stripeCustomerId',
        'createdAt',
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const settings = await Settings.findAll({ where: { userId: req.user.id } });
    const smtpSettings = await SmtpSetting.findAll({ where: { userId: req.user.id } });

    res.status(200).json({ user, settings, smtpSettings });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching settings.',
      error: error.message
    });
  }
};


async function updateUserVariables(userId, updateData) {
  const user = await User.findByPk(userId);

  const updates = [];

  if (updateData.name !== undefined) {
    const fullName = user.name || "";
    const firstName = fullName.split(" ")[0] || null;
    const lastName = fullName.split(" ").slice(1).join(" ") || null;

    updates.push(
      { variableName: "first_name", variableValue: firstName },
      { variableName: "last_name", variableValue: lastName },
      { variableName: "full_name", variableValue: fullName }
    );
  }

  if (updateData.email !== undefined) {
    updates.push({
      variableName: "email",
      variableValue: user.email
    });
  }

  if (updateData.companyName !== undefined) {
    updates.push({
      variableName: "company_name",
      variableValue: user.companyName
    });
  }

  if (updateData.phone !== undefined) {
    updates.push({
      variableName: "contact_phone",
      variableValue: user.phone
    });
  }

  // Apply updates one-by-one
  for (const u of updates) {
    await UserVariable.upsert({
      userId,
      variableName: u.variableName,
      variableValue: u.variableValue
    });
  }
}


// -------------------------
// Update general settings
// -------------------------
exports.updateGeneralSettings = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      name,
      companyName,
      email,
      phone,
      websiteUrl,
      timezone,
      currencyId,
      language,
      emailSignature
    } = req.body;

    // Build update object dynamically (only include provided fields)
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (currencyId !== undefined) updateData.currencyId = currencyId;
    if (language !== undefined) updateData.language = language;
    if (emailSignature !== undefined) updateData.emailSignature = emailSignature;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update." });
    }

    await User.update(updateData, {
      where: { id: req.user.id },
      transaction: t
    });

     const updatedUser = await User.findByPk(req.user.id, { transaction: t });

     // 🔥 Sync UserVariable table
    await updateUserVariables(req.user.id, updateData);

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

exports.updateNotifications = async (req, res) => {
    const { emailNotifications, smsNotifications } = req.body;
    const userId = req.user.id; // Assuming your auth middleware sets req.user

    try {
        // Update or create emailNotifications
        await Settings.upsert({
            userId,
            key: 'emailNotifications',
            value: emailNotifications.toString(),
        });

        // Update or create smsNotifications
        await Settings.upsert({
            userId,
            key: 'smsNotifications',
            value: smsNotifications.toString(),
        });

        res.json({ success: true, message: 'Notifications updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update notifications' });
    }
};


exports.updateSmtpSettings = async (req, res) => {
    try {
        const userId = req.user.id; // Logged-in user ID from middleware
        const {
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPass,
            smtpEncryption,
            fromName,
            fromEmail,
            smtpActive
        } = req.body;

        // -----------------------
        // VALIDATION
        // -----------------------
        if (
            !smtpHost ||
            !smtpPort ||
            !smtpUser ||
            !smtpPass ||
            !smtpEncryption ||
            !fromName ||
            !fromEmail
        ) {
            return res.status(400).json({
                success: false,
                message: "All SMTP fields are required."
            });
        }

        // -----------------------
        // CHECK IF USER EXISTS
        // -----------------------
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // -----------------------
        // CHECK IF SMTP SETTINGS ALREADY EXIST
        // -----------------------
        let smtpSettings = await SmtpSetting.findOne({
            where: { userId }
        });

        if (smtpSettings) {
            // UPDATE EXISTING
            await smtpSettings.update({
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPass,
                smtpEncryption,
                fromName,
                fromEmail,
                smtpActive: smtpActive === true
            });
        } else {
            // CREATE NEW SETTINGS
            smtpSettings = await SmtpSetting.create({
                userId,
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPass,
                smtpEncryption,
                fromName,
                fromEmail,
                smtpActive: smtpActive === true
            });
        }

        return res.status(200).json({
            success: true,
            message: "SMTP settings updated successfully.",
            data: smtpSettings
        });

    } catch (error) {
        console.error("SMTP Update Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update SMTP settings.",
            error: error.message
        });
    }
};
