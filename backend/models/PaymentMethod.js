// models/PaymentMethod.js
module.exports = (sequelize, DataTypes) => {
  const PaymentMethod = sequelize.define('PaymentMethod', {
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
    cardNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stripePaymentMethodId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cvc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cardholderName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cardType: {
      type: DataTypes.STRING,
      allowNull: false,
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
      allowNull: false,
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
