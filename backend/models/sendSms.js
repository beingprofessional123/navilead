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
   quote_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'quotes',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,  // ✔ Also required
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
    },
    spendCredits: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    }
  }, {
    tableName: 'sendSms', // your desired table name
    timestamps: true,
  });

  SendSms.associate = function(models) {
    SendSms.belongsTo(models.User, { foreignKey: 'userId' });
    SendSms.belongsTo(models.Quote, { foreignKey: 'quoteId', onDelete: 'CASCADE', constraints: false }); // ✅
    SendSms.belongsTo(models.SmsTemplate, { foreignKey: 'smsTemplateId' });
  };


  return SendSms;
};
