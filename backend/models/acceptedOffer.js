module.exports = (sequelize, DataTypes) => {
  const AcceptedOffer = sequelize.define(
    "AcceptedOffer",
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
        references: { model: "quotes", key: "id" }, // References the existing quotes table
        onDelete: "CASCADE",
      },
      acceptedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Records the timestamp when the offer was accepted
      },
      chosenServices: {
        type: DataTypes.JSONB, // Stores an array of chosen service IDs, or more detailed service objects
        allowNull: false,
        comment: 'JSON array of selected service IDs or objects',
      },
      totalPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      rememberNotes: {
        type: DataTypes.TEXT,
        allowNull: true, // Allow notes to be optional
      },
    },
    {
      tableName: "accepted_offers", // Name of the table in your database
      timestamps: true, // Adds createdAt and updatedAt columns
      updatedAt: false // You might only need createdAt for accepted offers
    }
  );

  AcceptedOffer.associate = (models) => {
    AcceptedOffer.belongsTo(models.Quote, { foreignKey: 'quoteId', as: 'quote',onDelete: "CASCADE", });
  };

  return AcceptedOffer;
};
