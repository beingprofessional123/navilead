module.exports = (sequelize, DataTypes) => {
  const Currency = sequelize.define('Currency', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'currencies',
    timestamps: false
  });

  Currency.associate = (models) => {
    Currency.hasMany(models.PricingTemplate, {
      foreignKey: 'currencyId',
      as: 'pricingTemplates'
    });
  };

  return Currency;
};
