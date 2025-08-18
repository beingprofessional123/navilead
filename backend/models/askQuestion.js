// models/askQuestion.js
module.exports = (sequelize, DataTypes) => {
  const AskQuestion = sequelize.define(
    'AskQuestion',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      quoteId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      leadId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      answer: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'AskQuestions',
      timestamps: true
    }
  );

  AskQuestion.associate = (models) => {
    // AskQuestion belongs to a specific Quote
    AskQuestion.belongsTo(models.Quote, {
      foreignKey: 'quoteId',
      as: 'quote',
      onDelete: 'CASCADE'
    });

    // AskQuestion belongs to a specific Lead
    AskQuestion.belongsTo(models.Lead, {
      foreignKey: 'leadId',
      as: 'lead',
      onDelete: 'CASCADE'
    });
  };

  return AskQuestion;
};
