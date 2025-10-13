module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
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
    planId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    smsPlanId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subscriptionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
     type: {
      type: DataTypes.ENUM('subscription', 'credit'),
      allowNull: false,
      defaultValue: 'subscription',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoiceUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoiceNo: {
      type: DataTypes.STRING, // Format: INV-2024-001
      allowNull: true,
      unique: true,
    },
  }, {
    tableName: 'transactions', // Your table name
    timestamps: true,
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Transaction.belongsTo(models.Plan, {   // 👈 Direct link
      foreignKey: 'planId',
      as: 'plan',
    });
    
    Transaction.belongsTo(models.SMSCreditPlan, {   // 👈 Direct link
      foreignKey: 'smsPlanId',
      as: 'smsPlan',
    });
  };

  return Transaction;
};
