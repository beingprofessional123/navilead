module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('statuses', [
      // Lead statuses
      { name: 'New', statusFor: 'Lead' },
      { name: 'In Dialogue', statusFor: 'Lead' },
      { name: 'Qualified', statusFor: 'Lead' },
      { name: 'Offer Sent', statusFor: 'Lead' },
      { name: 'Won', statusFor: 'Lead' },
      { name: 'Lost', statusFor: 'Lead' },

      // Quote statuses
      { name: 'Not sent', statusFor: 'Quote' },
      { name: 'Sent to customer', statusFor: 'Quote' },
      { name: 'Viewed by customer', statusFor: 'Quote' },
      { name: 'Accepted', statusFor: 'Quote' },
      { name: 'Rejected', statusFor: 'Quote' },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('statuses', {
      name: [
        'New',
        'In Dialogue',
        'Qualified',
        'Offer Sent',
        'Won',
        'Lost',
        'Not sent',
        'Sent to customer',
        'Viewed by customer',
        'Accepted',
        'Rejected',
      ]
    }, {});
  }
};
