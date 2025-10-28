// models/Settings.js
module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define(
    "Settings",
    {
       userId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Every setting must belong to a user
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      value: {
        type: DataTypes.TEXT, // Store any value as string/JSON
        allowNull: true,
      },
    },
    {
      tableName: "settings",
      timestamps: true, // createdAt and updatedAt
    }
  );

  return Settings;
};
