// models/smsCreditPlan.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SMSCreditPlan = sequelize.define('SMSCreditPlan', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        smsCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
        },
    }, {
        tableName: 'sms_credit_plans',
        timestamps: true,
    });

    // Associations (if needed)
    SMSCreditPlan.associate = (models) => {
        // Example: If a user can buy multiple SMS plans
        // SMSCreditPlan.hasMany(models.UserPlan, { foreignKey: 'smsPlanId' });
    };

    return SMSCreditPlan;
};
