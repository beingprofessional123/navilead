module.exports = (sequelize, DataTypes) => {
  const TicketMessage = sequelize.define('TicketMessage', {
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    senderType: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    attachment: {
      type: DataTypes.STRING
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });

  TicketMessage.associate = (models) => {
    TicketMessage.belongsTo(models.Ticket, { foreignKey: 'ticketId', as: 'ticket' });
    TicketMessage.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
  };

  return TicketMessage;
};