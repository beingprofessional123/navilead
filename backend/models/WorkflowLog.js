// models/WorkflowLog.js
module.exports = (sequelize, DataTypes) => {
  const WorkflowLog = sequelize.define(
    "WorkflowLog",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      workflowId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leadId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stepId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Step execution order in workflow",
      },
      status: {
        type: DataTypes.ENUM("pending", "done"),
        allowNull: false,
        defaultValue: "pending",
      },
      executedAt: {
        type: DataTypes.DATE,
        allowNull: true, // will be set once step actually runs
      },
    },
    {
      tableName: "workflow_logs",
      timestamps: true, // keeps createdAt & updatedAt
    }
  );

  WorkflowLog.associate = (models) => {
    WorkflowLog.belongsTo(models.Workflow, {
      foreignKey: "workflowId",
      as: "workflow",
    });
    WorkflowLog.belongsTo(models.WorkflowStep, {
      foreignKey: "stepId",
      as: "step",
    });
    WorkflowLog.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    WorkflowLog.belongsTo(models.Lead, {
      foreignKey: "leadId",
      as: "lead",
      onDelete: "CASCADE",
    });
  };

  return WorkflowLog;
};
