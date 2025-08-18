    const { Sequelize } = require('sequelize');
    const dotenv = require('dotenv');

    dotenv.config(); // Load environment variables (ensure this is also in your main entry file)
    
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS || '', // handle blank password
      {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        port: process.env.DB_PORT || 5432,
        logging: false,
        define: {
            timestamps: true,
            underscored: true,
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
      }
    );

    module.exports = sequelize;
