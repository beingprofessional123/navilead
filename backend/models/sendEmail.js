module.exports = (sequelize, DataTypes) => {
  const SendEmail = sequelize.define('SendEmail', {
    emailBody: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    emailSubject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emailTemplateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quoteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    recipientEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    attachments: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    userId: {                    // <--- Add userId field
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    tableName: 'sendEmail', // your desired table name
    timestamps: true,
  });

  SendEmail.associate = function(models) {
    SendEmail.belongsTo(models.User, { foreignKey: 'userId' });
    SendEmail.belongsTo(models.Quote, { foreignKey: 'quoteId' });
  };

  return SendEmail;
};
