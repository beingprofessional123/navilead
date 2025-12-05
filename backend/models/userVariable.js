// models/UserVariable.js
module.exports = (sequelize, DataTypes) => {
  const UserVariable = sequelize.define('UserVariable', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    variableName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    variableValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'user_variables',
    timestamps: true,
  });

  UserVariable.associate = (models) => {
    UserVariable.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserVariable;
};
