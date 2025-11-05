// sync.js
require('dotenv').config();
const sequelize = require('./config/database');

sequelize
  .sync({ alter: true }) // or { force: true } if you want to recreate tables
  .then(() => {
    console.log('✅ Database synced successfully');
    process.exit();
  })
  .catch((error) => {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  });
