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
      allowNull: false,
    },
    variableName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    variableValue: {
      type: DataTypes.TEXT,
      allowNull: false,
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
