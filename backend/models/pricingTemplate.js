// PricingTemplate.js
module.exports = (sequelize, DataTypes) => {
  const PricingTemplate = sequelize.define('PricingTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    terms: DataTypes.TEXT,
    currencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'currencies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    choiceType: {
      type: DataTypes.ENUM('single', 'multiple'),
      allowNull: false,
    },
  }, {
    tableName: 'pricing_templates',
    timestamps: true,
  });

  PricingTemplate.associate = (models) => {
    PricingTemplate.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    PricingTemplate.hasMany(models.PricingTemplateService, {
      foreignKey: 'pricingTemplateId',
      as: 'services',
      onDelete: 'CASCADE',
    });

    PricingTemplate.belongsTo(models.Currency, {
      foreignKey: 'currencyId',
      as: 'currency',
    });

    PricingTemplate.hasMany(models.Quote, {
      foreignKey: 'pricingTemplateId',
      as: 'quotes',
    });
  };

  return PricingTemplate;
};
