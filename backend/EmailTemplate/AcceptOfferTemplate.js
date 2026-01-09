// backend/EmailTemplate/AcceptOfferTemplate.js

module.exports = function AcceptOfferTemplate({
  salesRepName,
  customerName,
  offerId,
  offerLink,
  totalPrice,
  chosenServices,
  notes,
  signature,
  currency
}) {

  // --- 🛠️ WORKING LOGIC (SAME AS BEFORE) ---
  let servicesList = [];
  const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoUrl = `${appUrl}/assets/images/logo.png`; 

  const formattedSignature = signature ? signature.replace(/\n/g, '<br>') : '';

  try {
    if (Array.isArray(chosenServices)) {
      servicesList = chosenServices;
    } else if (typeof chosenServices === 'string') {
      let parsed = JSON.parse(chosenServices);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      if (Array.isArray(parsed)) {
        servicesList = parsed;
      }
    }
  } catch (error) {
    console.error("❌ Error parsing chosenServices:", error.message);
    servicesList = []; 
  }

  // 1. Generate HTML List with CLEAN styling
  const servicesHtml = servicesList && servicesList.length > 0 
    ? servicesList.map(s => `
        <li style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; list-style: none;">
          <div style="color: #333; font-weight: 600; font-size: 15px;">${s.name || 'Service'}</div>
          <div style="color: #666; font-size: 13px;">
            Price: ${currency.symbol}${s.price} ${s.quantity ? `&times; ${s.quantity}` : ''}
          </div>
        </li>
      `).join("") 
    : '<li style="color: #999; font-style: italic; list-style: none;">No specific services listed.</li>';

  // 2. Return Final HTML (Professional & Simple)
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style type="text/css">
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; }
  </style>
</head>
<body style="background-color: #f4f4f4; padding: 20px;">

  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #dddddd; border-radius: 4px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${appUrl}">
        <img src="${logoUrl}" alt="Logo" style="width: 150px; height: auto; display: inline-block;">
      </a>
    </div>

    <div style="text-align: center; margin-bottom: 30px; padding: 15px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px;">     
      <h2 style="color: #166534; margin: 0; font-size: 20px;">Offer #${offerId} Accepted! 🚀</h2>
      <p style="color: #166534; font-size: 14px; margin: 5px 0 0 0;">Congratulations, ${salesRepName}!</p>
    </div>

    <div style="margin-bottom: 25px;">
      <h3 style="margin: 0 0 10px 0; font-size: 22px; color: #111;">${customerName}</h3>
      <p style="font-size: 15px; color: #555; margin: 0;">The customer has successfully signed and accepted the offer.</p>
    </div>

    ${notes ? `
      <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #00d4f0; margin-bottom: 25px;">
        <p style="font-size: 12px; font-weight: bold; color: #888; margin: 0 0 5px 0; text-transform: uppercase;">Customer Notes:</p>
        <p style="font-size: 14px; margin: 0; color: #444; font-style: italic;">"${notes}"</p>
      </div>
    ` : ""}

    <h4 style="color: #111; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 20px;">Accepted Services</h4>
    
    <ul style="margin: 0; padding: 0;">
      ${servicesHtml}
    </ul>

    <div style="margin-top: 20px; text-align: right; padding: 15px 0;">
      <span style="color: #666; font-size: 16px;">Total Deal Value: </span>
      <span style="color: #111; font-size: 24px; font-weight: 800;">${currency.symbol} ${Number(totalPrice).toFixed(2)}</span>
    </div>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${offerLink}" target="_blank" style="background-color: #000; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; font-size: 14px;">
        View Offer Details
      </a>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee;">
       <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #111;">Regards,</h4>
       <div style="color: #666; font-size: 14px; line-height: 1.6;">
         ${formattedSignature || `${salesRepName}<br>Team Navilead`}
       </div>
    </div>

    <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
      <p><strong>Confidential:</strong> This email contains sensitive sales data. Do not forward outside the organization.</p>
    </div>

  </div>

</body>
</html>
  `;
};