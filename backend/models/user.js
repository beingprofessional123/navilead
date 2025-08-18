module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  User.associate = (models) => {
    User.hasMany(models.Lead, {
      foreignKey: 'userId',
      as: 'leads',
    });

    User.hasMany(models.PricingTemplate, {
      foreignKey: 'userId',
      as: 'pricingTemplates',
    });
    User.hasMany(models.EmailTemplate, {
      foreignKey: 'userId',
      as: 'emailTemplates',
    });
    User.hasMany(models.UserVariable, { foreignKey: 'userId', as: 'variables' });

  };

  return User;
};
