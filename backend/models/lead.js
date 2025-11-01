module.exports = (sequelize, DataTypes) => {
  const Lead = sequelize.define(
    "Lead",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      leadNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      attName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,   // ✅ now nullable
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,   // ✅ now nullable
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cvrNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      leadSource: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      internalNote: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customerComment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      followUpDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,       // ✅ allow null
        defaultValue: null,    // ✅ default null
      },
      notifyOnFollowUp: {
        type: DataTypes.BOOLEAN,
        allowNull: true,       // ✅ allow null
        defaultValue: null,    // or `false` if you want auto-false
      },
      attachments: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      statusId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "statuses", key: "id" },
        onDelete: "SET NULL",
      },
      value: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
    },
    {
      tableName: "leads",
      timestamps: true,
    }
  );

  Lead.associate = (models) => {
    Lead.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Lead.belongsTo(models.Status, { foreignKey: "statusId", as: "status" });
    Lead.hasMany(models.AskQuestion, { foreignKey: 'leadId', as: 'questions' });
    Lead.hasMany(models.StatusUpdateLog, {foreignKey: "leadId", as: "statusLogs"});
    Lead.hasMany(models.Quote, { foreignKey: "leadId", as: "quotes", onDelete: "CASCADE", });

  };

  return Lead;
};
