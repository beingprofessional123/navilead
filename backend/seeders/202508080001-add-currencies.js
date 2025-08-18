// backend/seeders/202508080001-add-currencies.js
'use strict';

module.exports = {
  up: async (queryInterface) => {
    const currencies = [
      { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
    ];

    for (const currency of currencies) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM currencies WHERE code = :code`,
        { replacements: { code: currency.code } }
      );

      if (existing.length === 0) {
        await queryInterface.bulkInsert('currencies', [currency]);
      }
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('currencies', {
      code: ['DKK', 'EUR', 'USD'],
    });
  },
};
