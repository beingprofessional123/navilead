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
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    websiteUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailSignature: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    companyLogo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    smsBalance: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    apikey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // By default, email is not verified
    },
    stripeCustomerId: {            // <-- NEW FIELD
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
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
    User.hasMany(models.ApiLog, { foreignKey: "userId", as: "apiLogs" });
    User.hasMany(models.Workflow, { foreignKey: 'userId', as: 'workflows' });
    User.hasMany(models.WorkflowLog, { foreignKey: "userId", as: "workflowLogs" });
    User.hasMany(models.OfferTemplate, { foreignKey: "userId", as: "offerTemplates" });
    User.hasMany(models.UserPlan, { foreignKey: 'userId', as: 'userPlans' });
    User.hasMany(models.Settings, { foreignKey: 'userId', as: 'settings' });
    User.hasMany(models.AcceptedOffer, { foreignKey: 'userId', as: 'acceptedOffers' });
     User.hasMany(models.AskQuestion, { foreignKey: 'userId', as: 'askQuestions' });
  };

  return User;
};
