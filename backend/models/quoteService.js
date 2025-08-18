module.exports = (sequelize, DataTypes) => {
  const QuoteService = sequelize.define(
    "QuoteService",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      quoteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "quotes", key: "id" },
        onDelete: "CASCADE",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      discount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      tableName: "quote_services",
      timestamps: true,
    }
  );

  QuoteService.associate = (models) => {
    QuoteService.belongsTo(models.Quote, { foreignKey: 'quoteId' });
  };

  return QuoteService;
};
