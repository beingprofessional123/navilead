// models/Plan.js
module.exports = (sequelize, DataTypes) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shortdescription: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2), // e.g. 10.00 = 10%
      allowNull: false,
      defaultValue: 0.00,
    },
    billing_type: {
      type: DataTypes.ENUM('free','monthly', 'yearly'),
      allowNull: false,
      defaultValue: 'free',
    },
    api_access: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    Total_Leads_Allowed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Total_offers_Allowed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Total_emails_allowed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Total_SMS_allowed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Total_email_templates_allowed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Total_SMS_Templates_Allowed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Total_pricing_Templates_Allowed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Total_workflows_Allowed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_offerPage_customization_allowed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    stripe_product_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stripe_price_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    }


  }, {
    tableName: 'plans',
    timestamps: true,
  });

  Plan.associate = (models) => {
     Plan.hasMany(models.Transaction, { foreignKey: 'planId', as: 'transactions' });
  };

  return Plan;
};
