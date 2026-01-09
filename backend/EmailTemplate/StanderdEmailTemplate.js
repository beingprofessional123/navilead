// backend/EmailTemplate/StanderdEmailTemplate.js

module.exports = function StanderdEmailTemplate({ emailSubject, emailBody, signature, attachments = [] }) {
  // Default logo
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoUrl = `${frontendUrl}/assets/images/logo.png`; 

  const formattedSignature = signature ? signature.replace(/\n/g, '<br>') : '';

  // Logic to create a list of attachment names if they exist (Cleaned up UI)
  let attachmentListHtml = '';
  if (attachments && attachments.length > 0) {
    const items = attachments.map(file => {
      const fileUrl = file.path || file.url || '#'; 
      const fileName = file.filename || 'Attachment';

      return `
        <li style="margin-bottom: 8px;">
          <a href="${fileUrl}" target="_blank" style="color: #0066cc; text-decoration: underline; font-size: 14px;">
            📎 ${fileName}
          </a>
        </li>`;
    }).join('');
    
    attachmentListHtml = `
      <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eeeeee;">
        <p style="font-size: 12px; font-weight: bold; color: #888888; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Attachments included:
        </p>
        <ul style="padding-left: 0; list-style: none; margin: 0;">
          ${items}
        </ul>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>${emailSubject || 'Notification'}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    body {
        font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
        margin: 0px;
        padding: 0px;
        background-color: #f4f4f4;
        color: #333333;
    }
    @media only screen and (max-width: 600px) {
      .mail-wrapper { width: 100% !important; margin: 0px !important; }
      .mail-content { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">

<div style="padding: 20px 0;">
  <div class="mail-wrapper" style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">
    
    <div class="mail-content" style="padding: 40px;">
        
      <div style="margin-bottom: 30px; text-align: center;">
        <a href="${frontendUrl}" style="display: inline-block;">
          <img src="${logoUrl}" alt="Logo" style="width: 150px; height: auto; display: block;">
        </a>
      </div>

      <div style="padding-bottom: 15px; border-bottom: 2px solid #f9f9f9; margin-bottom: 25px;">     
        <h2 style="font-weight: 600; font-size: 18px; color: #111111; margin: 0;">
          ${emailSubject}
        </h2> 
      </div>

      <div style="color: #444444; font-size: 15px; line-height: 1.7;">
        <div style="margin-bottom: 20px;">
          ${emailBody}
        </div>
      </div>  

      ${attachmentListHtml}

      <div style="margin-top: 40px; border-top: 1px solid #eeeeee; padding-top: 20px;">
        <p style="margin: 0px 0px 5px 0px; font-weight: 600; font-size: 15px; color: #111111;">
          Regards,
        </p>
        <div style="font-size: 15px; color: #666666; line-height: 1.5;">
          ${formattedSignature ? formattedSignature : 'Team NaviLead'}
        </div>
      </div>

    </div>

    <div style="background-color: #fcfcfc; padding: 25px 40px; border-top: 1px solid #eeeeee;">
      <div style="margin-bottom: 15px;">
        <h5 style="margin: 0px 0px 5px 0px; font-size: 12px; font-weight: 700; color: #888888; text-transform: uppercase;">Security Notice</h5>
        <p style="font-size: 12px; margin: 0px; color: #999999; line-height: 1.4;">
          This email is intended for the registered user. Please do not share secure links with anyone.
        </p>
      </div>
      <div>
        <h5 style="margin: 0px 0px 5px 0px; font-size: 12px; font-weight: 700; color: #888888; text-transform: uppercase;">About NaviLead</h5>
        <p style="font-size: 12px; margin: 0px; color: #999999; line-height: 1.4;">
          Automate your outreach and manage your leads efficiently.
        </p>
      </div>
    </div>

  </div>
</div>
</body>
</html>
  `;
};