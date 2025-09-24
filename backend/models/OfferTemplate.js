module.exports = (sequelize, DataTypes) => {
  const OfferTemplate = sequelize.define(
    "OfferTemplate",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      companyLogo: {
        type: DataTypes.STRING, // URL or file path
        allowNull: true,
      },
      aboutUsLogo: {
        type: DataTypes.STRING, // URL or file path
        allowNull: true,
      },
      aboutUsDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      htmlCode: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customHtml: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false, // default is false
      },
      mainBgColor: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '#101418', // main page background
      },
      leftCardBgColor: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '#101418', // left card (form)
      },
      rightCardBgColor: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '#101418', // right card (preview)
      },
      textColor: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '#ccffff',
      },
      subTextColor: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '#8cd9d9',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users", // ⚡ should match actual table name (lowercase plural)
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "offers_templates",
      timestamps: true,
    }
  );

  OfferTemplate.associate = (models) => {
    OfferTemplate.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return OfferTemplate;
};
