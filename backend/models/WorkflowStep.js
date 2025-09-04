module.exports = (sequelize, DataTypes) => {
  const WorkflowStep = sequelize.define(
    'WorkflowStep',
    {
      workflowId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      config: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'workflow_steps',
      timestamps: true,
    }
  );

  WorkflowStep.associate = (models) => {
    WorkflowStep.belongsTo(models.Workflow, {
      foreignKey: 'workflowId',
      as: 'workflow',
    });
  };

  return WorkflowStep;
};
