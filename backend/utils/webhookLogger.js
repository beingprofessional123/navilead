const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'webhookLogger.log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function writeLog(level, eventType, message, meta = {}) {
  const timestamp = new Date().toISOString();

  const logEntry = `
[${timestamp}] [${level}] [${eventType}]
User: ${meta.userId || 'N/A'} 
Subscription: ${meta.subscriptionId || 'N/A'}
Invoice: ${meta.invoiceNo || 'N/A'}
Message: ${message}
${meta.errorStack ? `Stack: ${meta.errorStack}` : ''}
--------------------------------------------------------
`;

  fs.appendFileSync(logFile, logEntry, 'utf8');
}

module.exports = {
  info: (eventType, message, meta) =>
    writeLog('INFO', eventType, message, meta),

  error: (eventType, message, meta) =>
    writeLog('ERROR', eventType, message, meta),
};
