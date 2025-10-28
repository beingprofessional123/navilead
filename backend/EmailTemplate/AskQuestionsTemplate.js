// backend/EmailTemplate/AskQuestionsTemplate.js
module.exports = function AskQuestionsTemplate({
  firstName,
  customerFullName,
  offerLink,
  question,
  customerEmail,
}) {

    const appUrl = process.env.FRONTEND_URL || '#'; // Fallback to '#' if env var is missing
  const logoUrl = `${appUrl}/assets/images/logo.svg`;

  // Set default values for placeholders in case data is missing
  const recipientName = firstName || "Partner";
  const custName = customerFullName || "a Customer";
  const questionText = question || "The customer did not provide a question.";
  const replyEmail = customerEmail || "#"; // Use # if email is missing
  const replyLink = customerEmail ? `mailto:${customerEmail}` : "#";
  const linkText = offerLink || "#";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Question About Your Offer</title>
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
        <span style="font-weight: 700;">Hello ${recipientName},</span> a customer has a question about your offer!
      </p> 
    </div>

    <div class="namemail">
      <h3 style="margin: 0px 0px 10px 0px;font-weight: 500;font-size: 16px;color: #cff;">Question from ${custName}</h3>
      
      <p style="font-size: 14px;margin: 0px 0px 10px 0px;color: #8cd9d9;">
        Offer: <a href="${linkText}" style="color: #00d4f0;">${linkText}</a>
      </p>

      <p style="font-size: 14px;margin: 0px 0px 20px 0px;color: #cff; padding: 10px; border-left: 3px solid #00d4f0; background: #202e3c;">
        <span style="font-style: italic;">"${questionText}"</span>
      </p>

      <h3 style="margin: 0px 0px 7px 0px;font-weight: 500;font-size: 16px;color: #cff;">How to Reply:</h3>
      <p style="font-size: 14px;margin: 0px 0px 17px 0px;color: #8cd9d9;">
        Please reply directly to the customer at their email address below:
      </p>
      <a href="${replyLink}" style="color: #00d4f0;margin: 0px 0px 10px 0px;display: block; font-weight: 600;">${replyEmail}</a>
    </div>  

    </div>

    <div class="mail-messages-bottom" style="padding: 30px;">
     
     <div class="footer">
     <h3 style="margin: 0px 0px 7px 0px;font-size: 14px;font-weight: 600;color: #cff;">Best Regards,</h3>
     <p style="font-size: 14px;margin: 0px;color: #8cd9d9;">Team NaviLead</p>
     <p style="font-size: 12px;margin: 15px 0 0 0;color: #555;">(You are receiving this email because you sent an offer through the NaviLead platform.)</p>
    </div> 
    </div>

</div>
</div>

</body>
</html>
  `;
};