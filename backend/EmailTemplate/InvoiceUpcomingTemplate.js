/**
 * Generate Upcoming Invoice Email Template
 * @param {Object} params
 * @param {string} params.name - User's name
 * @param {string} params.invoiceUrl - Stripe hosted invoice URL
 * @param {string} params.amount - Amount to be paid (in cents)
 * @param {string} params.currency - Currency code
 * @param {number} params.dueDate - Invoice due date (as a UNIX timestamp in seconds)
 * @returns {string} HTML content
 */
function InvoiceUpcomingTemplate({ name, invoiceUrl, amount, currency, dueDate }) {

  const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoUrl = `${appUrl}/assets/images/logo.png`;
  
  // --- EXISTING WORKING LOGIC ---
  const formattedAmount = (amount / 100).toFixed(2);
  const formattedCurrency = currency ? currency.toUpperCase() : 'USD';
  
  const formattedDueDate = new Date(dueDate * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const recipientName = name || "Valued Customer";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    body {
        font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
        margin: 0px;
        padding: 0px;
        background-color: #f9f9f9;
        color: #333333;
    }
  </style>
</head>
<body style="background-color: #f9f9f9; padding: 20px;">

<div style="max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">
  
  <div style="padding: 40px;">

    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${appUrl}" style="display: inline-block;">
        <img src="${logoUrl}" alt="Logo" style="width: 150px; height: auto;">
      </a>
    </div>

    <div style="text-align: center; border-bottom: 1px solid #eeeeee; padding-bottom: 25px; margin-bottom: 25px;">     
      <h2 style="font-size: 20px; color: #111111; margin: 0;">Subscription Renewal Notice</h2>
      <p style="font-size: 14px; color: #666666; margin-top: 5px;">Invoice reminder for ${recipientName}</p>
    </div>

    <div style="font-size: 15px; line-height: 1.6; color: #444444;">
      <p>Hello ${recipientName},</p>
      <p>Your subscription is scheduled for renewal soon. The payment will be automatically processed on the date mentioned below.</p>

      <div style="background: #f8f9fa; border: 1px solid #eeeeee; border-radius: 6px; padding: 20px; margin: 25px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #666666; font-size: 14px;">Amount Due:</td>
            <td style="padding: 5px 0; color: #111111; font-size: 18px; font-weight: 700; text-align: right;">
              ${formattedAmount} ${formattedCurrency}
            </td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666666; font-size: 14px;">Renewal Date:</td>
            <td style="padding: 5px 0; color: #111111; font-size: 15px; font-weight: 600; text-align: right;">
              ${formattedDueDate}
            </td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${invoiceUrl}" target="_blank" 
           style="background: #000000; color: #ffffff; padding: 14px 28px; 
                  text-decoration: none; border-radius: 4px; display: inline-block; 
                  font-weight: 600; font-size: 15px;">
            View Invoice & Update Payment
        </a>
      </div>

      <p style="font-size: 13px; color: #777777;">
        If you have any questions or need to make changes to your plan, please contact our support team.
      </p>
    </div>  

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee;">
       <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #111;">Thank You,</h4>
       <p style="font-size: 14px; margin: 0; color: #666;">Team NaviLead</p>
       <p style="font-size: 11px; margin-top: 25px; color: #999999; line-height: 1.4; text-align: center;">
         This is an automated reminder regarding your upcoming payment. 
         Please do not reply directly to this email.
       </p>
    </div>

  </div>
</div>

</body>
</html>
  `;
}

module.exports = InvoiceUpcomingTemplate;