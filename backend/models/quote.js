module.exports = (sequelize, DataTypes) => {
  const Quote = sequelize.define(
    "Quote",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      leadId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "leads", key: "id" },
        onDelete: "CASCADE",
      },
      pricingTemplateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "pricing_templates", key: "id" },
        onDelete: "SET NULL",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      validDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      overallDiscount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      terms: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      total: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
     statusId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "statuses", key: "id" },
        onDelete: "SET NULL",
      },
    },
    {
      tableName: "quotes",
      timestamps: true,
    }
  );

  Quote.associate = (models) => {
    Quote.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Quote.belongsTo(models.Lead, { foreignKey: 'leadId', as: 'lead' });
    Quote.belongsTo(models.Status, { foreignKey: "statusId", as: "status" });
    Quote.belongsTo(models.PricingTemplate, { foreignKey: 'pricingTemplateId', as: 'pricingTemplate' });
    Quote.hasMany(models.QuoteService, { foreignKey: 'quoteId', as: 'services' });
    Quote.hasMany(models.AcceptedOffer, { foreignKey: 'quoteId', as: 'acceptedOffers',onDelete: "CASCADE", });
    Quote.hasMany(models.AskQuestion, { foreignKey: 'quoteId', as: 'questions' });

     // 👇 Add missing cascade
  Quote.hasMany(models.SendEmail, { foreignKey: 'quoteId', as: 'emails', onDelete: "CASCADE" });
  Quote.hasMany(models.SendSms, { foreignKey: 'quoteId', as: 'sms', onDelete: "CASCADE" });
  };

  return Quote;
};
