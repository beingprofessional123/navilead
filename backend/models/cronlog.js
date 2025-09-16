// models/cronlog.js
module.exports = (sequelize, DataTypes) => {
  const CronLog = sequelize.define('CronLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    finishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'started'
    },
    processedLeads: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    processedSteps: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'cron_logs',
    timestamps: false
  });

  CronLog.associate = (models) => {
    // फिलहाल कोई relation नहीं है,
    // पर बाद में WorkflowLog या User से relation add कर सकते हो
  };

  return CronLog;
};
