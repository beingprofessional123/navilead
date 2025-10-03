// models/PaymentMethod.js
module.exports = (sequelize, DataTypes) => {
  const PaymentMethod = sequelize.define('PaymentMethod', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cardNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripePaymentMethodId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cvc: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardholderName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardType: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Visa',
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cvrNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cityPostalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
  }, {
    tableName: 'payment_methods',
    timestamps: true,
  });

  PaymentMethod.associate = (models) => {
    PaymentMethod.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return PaymentMethod;
};
