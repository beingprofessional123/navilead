// models/Settings.js
module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define(
    "Settings",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "user_id",
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "settings",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "key"], // 🔑 unique per user
        },
      ],
    }
  );

  return Settings;
};
