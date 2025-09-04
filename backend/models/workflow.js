module.exports = (sequelize, DataTypes) => {
  const Workflow = sequelize.define(
    'Workflow',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      triggerEvent: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'workflows',
      timestamps: true,
    }
  );

  Workflow.associate = (models) => {
    Workflow.hasMany(models.WorkflowStep, {
      foreignKey: 'workflowId',
      as: 'steps',
      onDelete: 'CASCADE',
    });
    Workflow.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Workflow;
};
