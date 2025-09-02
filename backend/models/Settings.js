// models/Settings.js
module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define(
    "Settings",
    {
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Each key should be unique
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
