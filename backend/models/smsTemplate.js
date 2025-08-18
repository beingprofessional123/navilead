module.exports = (sequelize, DataTypes) => {
  const SmsTemplate = sequelize.define('SmsTemplate', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    templateName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recipientPhone: {
      type: DataTypes.STRING,
      defaultValue: '{{contact_phone}}',
    },
    smsContent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    tableName: 'sms_templates',
    timestamps: true,
  });

  SmsTemplate.associate = (models) => {
    SmsTemplate.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return SmsTemplate;
};
