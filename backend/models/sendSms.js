module.exports = (sequelize, DataTypes) => {
  const SendSms = sequelize.define('SendSms', {
    smsMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    smsTemplateId: {
      type: DataTypes.INTEGER,
      allowNull: true, // can be null if no template used
    },
    quoteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    recipientPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'YourCompany',
    },
    userId: { // <--- Add userId field
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    tableName: 'sendSms', // your desired table name
    timestamps: true,
  });

  SendSms.associate = function(models) {
    SendSms.belongsTo(models.User, { foreignKey: 'userId' });
    SendSms.belongsTo(models.Quote, { foreignKey: 'quoteId' });
    SendSms.belongsTo(models.SmsTemplate, { foreignKey: 'smsTemplateId' });
  };

  return SendSms;
};
