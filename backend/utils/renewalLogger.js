const fs = require('fs');
const path = require('path');

function logSubscriptionRenewal(user, invoice) {
  try {
    const logDir = path.join(process.cwd(), 'logs');

    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const filePath = path.join(logDir, 'subscription-renewals.log');

    const logEntry = `
==================================================
Renewed At     : ${new Date().toISOString()}
User ID        : ${user.id}
User Email     : ${user.email}
Subscription ID: ${invoice.subscription}
Invoice No     : ${invoice.number}
Amount Paid    : ${invoice.amount_paid / 100} ${invoice.currency}
Period Start   : ${new Date(invoice.lines.data[0].period.start * 1000).toISOString()}
Period End     : ${new Date(invoice.lines.data[0].period.end * 1000).toISOString()}
==================================================

`;

    fs.appendFileSync(filePath, logEntry, 'utf8');

    console.log(`📁 Renewal log written to subscription-renewals.log`);

  } catch (error) {
    console.error('❌ Failed to write renewal log:', error.message);
  }
}

module.exports = { logSubscriptionRenewal };
