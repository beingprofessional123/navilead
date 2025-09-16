module.exports = (sequelize, DataTypes) => {
  const StatusUpdateLog = sequelize.define(
    "StatusUpdateLog",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      leadId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "leads", key: "id" },
        onDelete: "CASCADE",
      },
      statusId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "statuses", key: "id" },
        onDelete: "SET NULL",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "status_update_logs",
      updatedAt: false, // सिर्फ createdAt चाहिए
    }
  );

  StatusUpdateLog.associate = (models) => {
    StatusUpdateLog.belongsTo(models.Lead, {
      foreignKey: "leadId",
      as: "lead",
    });

    StatusUpdateLog.belongsTo(models.Status, {
      foreignKey: "statusId",
      as: "status",
    });
  };

  return StatusUpdateLog;
};
