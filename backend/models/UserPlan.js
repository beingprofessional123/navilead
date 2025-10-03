const { STRING } = require("sequelize");

// models/UserPlan.js
module.exports = (sequelize, DataTypes) => {
  const UserPlan = sequelize.define('UserPlan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true, // null for lifetime/free plans
    },
    renewalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subscriptionId: {
      type: DataTypes.STRING,
      allowNull: true, // Stripe subscription ID
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'user_plans',
    timestamps: true,
  });

  UserPlan.associate = (models) => {
  UserPlan.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  UserPlan.belongsTo(models.Plan, { foreignKey: 'planId', as: 'plan' });

  };
  return UserPlan;
};
