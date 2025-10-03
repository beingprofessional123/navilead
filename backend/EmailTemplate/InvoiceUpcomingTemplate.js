/**
 * Generate Upcoming Invoice Email Template
 * @param {Object} params
 * @param {string} params.name - User's name
 * @param {string} params.invoiceUrl - Stripe hosted invoice URL
 * @param {string} params.amount - Amount to be paid
 * @param {string} params.currency - Currency code
 * @param {Date} params.dueDate - Invoice due date
 * @returns {string} HTML content
 */
function InvoiceUpcomingTemplate({ name, invoiceUrl, amount, currency, dueDate }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #2c3e50;">Upcoming Subscription Renewal</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Your subscription will renew soon. Here are the details:</p>
      <ul>
        <li><strong>Amount:</strong> ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</li>
        <li><strong>Due Date:</strong> ${new Date(dueDate * 1000).toLocaleDateString()}</li>
      </ul>
      <p>You can review your invoice here:</p>
      <p><a href="${invoiceUrl}" target="_blank" 
            style="background:#4CAF50;color:white;padding:10px 15px;
                   text-decoration:none;border-radius:5px;">
          View Invoice
      </a></p>
      <br/>
      <p>Thank you for staying with us!</p>
      <p style="font-size: 12px; color: #888;">This is an automated reminder. Please do not reply.</p>
    </div>
  `;
}

module.exports = InvoiceUpcomingTemplate;
