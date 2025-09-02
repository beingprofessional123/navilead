// models/ApiLog.js
module.exports = (sequelize, DataTypes) => {
  const ApiLog = sequelize.define(
    "ApiLog",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      url: {
        type: DataTypes.TEXT, // Store the latest URL hit
        allowNull: true,
      },
    },
    {
      tableName: "api_logs",
      timestamps: true,
    }
  );

  ApiLog.associate = (models) => {
    ApiLog.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return ApiLog;
};
