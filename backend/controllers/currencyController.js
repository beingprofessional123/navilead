const db = require('../models');
const { Currency } = db;

exports.getCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.findAll({
      attributes: ['id', 'code', 'name', 'symbol']
    });
    res.json(currencies);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching currencies', error: err.message });
  }
};
