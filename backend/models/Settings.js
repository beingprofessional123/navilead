module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define("Settings", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id",
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: "settings",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "key"], // ✅ unique per user
      },
    ],
  });

  return Settings;
};
