module.exports = (sequelize, DataTypes) => {
  const PricingTemplateService = sequelize.define('PricingTemplateService', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    pricingTemplateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'pricing_template_services',
    timestamps: true,
  });

  PricingTemplateService.associate = (models) => {
    PricingTemplateService.belongsTo(models.PricingTemplate, {
      foreignKey: 'pricingTemplateId',
      as: 'template',
      onDelete: 'CASCADE',
    });
  };

  return PricingTemplateService;
};
