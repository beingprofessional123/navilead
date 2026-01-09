// backend/EmailTemplate/AskQuestionsTemplate.js
module.exports = function AskQuestionsTemplate({
  firstName,
  customerFullName,
  offerLink,
  question,
  customerEmail,
}) {

  const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoUrl = `${appUrl}/assets/images/logo.png`;

  // Set default values for placeholders
  const recipientName = firstName || "Partner";
  const custName = customerFullName || "a Customer";
  const questionText = question || "The customer did not provide a question.";
  const replyEmail = customerEmail || "No email provided";
  const replyLink = customerEmail ? `mailto:${customerEmail}` : "#";
  const linkText = offerLink || "#";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    body {
        font-family: 'Segoe UI', Arial, sans-serif;
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

    <div style="border-bottom: 1px solid #eeeeee; padding-bottom: 20px; margin-bottom: 25px;">     
      <p style="font-size: 16px; line-height: 24px; color: #111111; margin: 0;">
        <span style="font-weight: 700;">Hello ${recipientName},</span>
        <br>A customer has a question regarding your offer.
      </p> 
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0px 0px 10px 0px; font-weight: 600; font-size: 16px; color: #111111;">
        Question from ${custName}:
      </h3>
      
      <div style="font-size: 15px; color: #444444; padding: 20px; border-left: 4px solid #000000; background: #fcfcfc; font-style: italic; margin-bottom: 15px;">
        "${questionText}"
      </div>

      <p style="font-size: 14px; color: #666666;">
        <strong>Reference Offer:</strong> <a href="${linkText}" style="color: #0066cc; text-decoration: underline;">${linkText}</a>
      </p>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee;">
       <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #111;">Best Regards,</h4>
       <p style="font-size: 14px; margin: 0; color: #666;">Team NaviLead</p>
       <p style="font-size: 11px; margin-top: 20px; color: #999; line-height: 1.4;">
         This is a system notification because an offer was sent through the NaviLead platform.
       </p>
    </div>

  </div>
</div>

</body>
</html>
  `;
};