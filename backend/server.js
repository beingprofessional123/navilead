const app = require('./app');
const db = require('./models/index'); // Import Sequelize models

const PORT = process.env.PORT || 4000;

// Sync DB and then start server
db.sequelize.sync({ alter: true }) // Use { force: true } only in development if you want to drop & recreate tables
  .then(() => {
    console.log('✅ Database synced');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ DB sync failed:', err);
  });