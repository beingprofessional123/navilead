// models/SmtpSetting.js
module.exports = (sequelize, DataTypes) => {
    const SmtpSetting = sequelize.define("SmtpSetting", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        smtpHost: {
            type: DataTypes.STRING,
            allowNull: false
        },
        smtpPort: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        smtpUser: {
            type: DataTypes.STRING,
            allowNull: false
        },
        smtpPass: {
            type: DataTypes.STRING,
            allowNull: false
        },
        smtpEncryption: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fromName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fromEmail: {
            type: DataTypes.STRING,
            allowNull: false
        },
        smtpActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

    SmtpSetting.associate = (models) => {
        SmtpSetting.belongsTo(models.User, {
            foreignKey: "userId",
            onDelete: "CASCADE"
        });
    };

    return SmtpSetting;
};
