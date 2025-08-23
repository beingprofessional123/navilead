// models/emailTemplate.js
module.exports = (sequelize, DataTypes) => {
  const EmailTemplate = sequelize.define('EmailTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    templateName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recipientEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "{{contact_email}}",
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ccEmails: {
      type: DataTypes.STRING, // You can store comma separated or JSON string
      allowNull: true,
    },
    emailContent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'email_templates',
    timestamps: true,
  });

  EmailTemplate.associate = (models) => {
    EmailTemplate.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

  };

  return EmailTemplate;
};
