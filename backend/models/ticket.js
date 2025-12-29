module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define('Ticket', {
    ticket_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('Technical Issue', 'Feature Request', 'Billing Inquiry', 'General Question', 'Bug Report', 'Access Problem'),
      defaultValue: 'General Question'
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
      defaultValue: 'Medium'
    },
    status: {
      type: DataTypes.ENUM('Open', 'Pending', 'Resolved', 'Closed'),
      defaultValue: 'Open'
    },
    description: {
      type: DataTypes.TEXT
    },
    attachment: {
      type: DataTypes.STRING // Stores file path/URL
    }
  });

  Ticket.associate = (models) => {
    Ticket.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Ticket.hasMany(models.TicketMessage, { foreignKey: 'ticketId', as: 'messages', onDelete: 'CASCADE' });
  };

  return Ticket;
};