module.exports = (sequelize, DataTypes) => {
  const Status = sequelize.define('Status', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    statusFor: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['Lead', 'Quote']],
      },
    },
  }, {
    tableName: 'statuses',
    timestamps: false,
  });

  Status.associate = (models) => {
    Status.hasMany(models.Lead, {
      foreignKey: 'statusId',
      as: 'leads',
    });
    Status.hasMany(models.Quote, {
      foreignKey: 'statusId',
      as: 'quotes',
    });
  };

  return Status;
};
