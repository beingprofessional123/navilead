// sync.js
require('dotenv').config();
require('./models'); // make sure User model is registered
const sequelize = require('./config/database');


sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Database synced successfully');
    process.exit();
  })
  .catch((error) => {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  });
