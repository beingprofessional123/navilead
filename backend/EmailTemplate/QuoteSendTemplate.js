// backend/EmailTemplate/QuoteSendTemplate.js

module.exports = function QuoteSendTemplate({ emailSubject, emailBody, signature, attachments }) {
  
  // 1. Setup URLs
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoUrl = `${frontendUrl}/assets/images/logo.png`;

  // 2. Format Body (Convert \n to <br>)
  let formattedBody = emailBody ? emailBody.replace(/\n/g, '<br>') : '';

  // 3. Format Signature
  const formattedSignature = signature ? signature.replace(/\n/g, '<br>') : '';

  // 4. Generate Attachments HTML (Simplified)
  let attachmentHtml = '';
  if (Array.isArray(attachments) && attachments.length > 0) {
    attachmentHtml = `
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eeeeee;">
        <p style="font-size: 14px; font-weight: bold; color: #333333; margin-bottom: 10px;">Attachments:</p>
        ${attachments.map(att => `
          <a href="${att.path}" target="_blank" style="display: inline-block; margin-right: 15px; margin-bottom: 10px; color: #0066cc; text-decoration: underline; font-size: 14px;">
            ${att.filename}
          </a>
        `).join('')}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style type="text/css">
    body { 
      font-family: 'Segoe UI', Helvetica, Arial, sans-serif; 
      line-height: 1.6; 
      color: #333333; 
      margin: 0; 
      padding: 0;
    }
  </style>
</head>
<body style="background-color: #f9f9f9; padding: 20px;">

  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #dddddd; border-radius: 8px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="${logoUrl}" alt="Logo" style="width: 150px; height: auto;">
    </div>

    <h2 style="font-size: 18px; color: #111111; margin-bottom: 20px; font-weight: 600;">
      ${emailSubject}
    </h2>

    <div style="font-size: 15px; color: #444444;">
      ${formattedBody}
    </div>

    <div style="margin-top: 30px; color: #666666; font-size: 15px;">
       ${formattedSignature}
    </div>

    ${attachmentHtml}

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999; text-align: center;">
      <p>This is a notification from NaviLead.</p>
      <p>Please do not reply directly to this automated email.</p>
    </div>

  </div>

</body>
</html>
  `;
};