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

   const appUrl = process.env.FRONTEND_URL || '#'; // Fallback to '#' if env var is missing
  const logoUrl = `${appUrl}/assets/images/logo.svg`;
  // Format the amount and date for display
  const formattedAmount = (amount / 100).toFixed(2);
  const formattedCurrency = currency ? currency.toUpperCase() : 'USD';
  
  // Convert Unix timestamp (seconds) to a readable date string
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
  <title>Upcoming Invoice</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
    body {
        font-family: 'Montserrat', sans-serif;
        margin: 0px;
        background: #fff;
    }
  </style>
</head>
<body>

<div class="mail-messages-body-top" style="width: 640px;margin: 50px auto;color: rgba(204, 255, 255, 1);">
  <div class="mail-messages-body" style="padding: 20px;background: #101418;">

    <div class="mail-messages" style="background: #171f26;padding: 30px;border: 1px solid #202e3c;">
    
   <div class="mail-logo" style="margin-bottom: 20px;">
      <a href="${appUrl}" style="display: inline-block; width: 160px;"><img src="${logoUrl}" class="img-fluid" alt="" style="max-width: 100%; height: auto;"></a>
    </div>

    <div class="mail-docu" style="padding: 28px 36px 36px 36px;border-radius: 2px;background: #171f26;border: 1px solid #202e3c;;text-align: center;margin-bottom: 20px;">     
      <p style="font-weight: 400;font-size: 16px;line-height: 24px;color: #cff;margin-bottom: 0px;margin-top: 0px;">
        <span style="font-weight: 700;">Important:</span> Your Subscription Renewal is Upcoming.
      </p> 
    </div>

    <div class="namemail">
      <h3 style="margin: 0px 0px 5px 0px;font-weight: 500;font-size: 16px;color: #cff;">Dear ${recipientName},</h3>
      
      <p style="font-size: 14px;margin: 0px 0px 17px 0px;color: #8cd9d9;">
        Your subscription is scheduled for renewal soon. The payment will be automatically processed on the due date.
      </p>

      <ul style="margin: 0px 0px 20px 0px;padding: 0px;list-style: none; border-left: 3px solid #00d4f0; background: #202e3c; padding: 15px;">
        <li style="margin-bottom: 10px;">
         <h5 style="margin: 0px 0px 5px 0px;font-size: 14px;font-weight: 600;color: #cff;">Amount Due:</h5>
         <p style="font-size: 16px;margin: 0px;color: #00d4f0; font-weight: 700;">${formattedAmount} ${formattedCurrency}</p>
        </li>
        
        <li>
          <h5 style="margin: 0px 0px 5px 0px;font-size: 14px;font-weight: 600;color: #cff;">Renewal Date:</h5>
          <p style="font-size: 14px;margin: 0px;color: #cff;">${formattedDueDate}</p>
        </li>
      </ul>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${invoiceUrl}" target="_blank" 
              style="background: #00d4f0; color: #171f26; padding: 12px 25px; 
                     text-decoration: none; border-radius: 4px; display: inline-block; 
                     font-weight: 700; font-size: 16px;">
            View Invoice & Update Payment
        </a>
      </p>

      <p style="font-size: 14px;margin: 20px 0px 0px 0px;color: #8cd9d9;">
        If you have any questions regarding this invoice, please contact our support team.
      </p>
    </div>  

    </div>

    <div class="mail-messages-bottom" style="padding: 30px;">
     <div class="footer">
       <h3 style="margin: 0px 0px 7px 0px;font-size: 14px;font-weight: 600;color: #cff;">Thank You,</h3>
       <p style="font-size: 14px;margin: 0px;color: #8cd9d9;">Team NaviLead</p>
       <p style="font-size: 12px;margin: 15px 0 0 0;color: #555;">This is an automated reminder regarding your upcoming payment.</p>
     </div> 
    </div>

</div>
</div>

</body>
</html>
  `;
}

module.exports = InvoiceUpcomingTemplate;