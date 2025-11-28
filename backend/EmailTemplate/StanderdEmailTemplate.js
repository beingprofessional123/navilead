// backend/EmailTemplate/StanderdEmailTemplate.js

module.exports = function StanderdEmailTemplate({ emailSubject, emailBody, signature, attachments = [] }) {
  // Default logo
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoUrl = `${frontendUrl}/assets/images/logo.png`; // Make sure this image exists!

  const formattedSignature = signature ? signature.replace(/\n/g, '<br>') : '';

  // Logic to create a list of attachment names if they exist
  let attachmentListHtml = '';
  if (attachments && attachments.length > 0) {
    const items = attachments.map(file => {
      // Check if there is a path/url to link to. If not, just show text.
      const fileUrl = file.path || file.url || '#'; 
      const fileName = file.filename || 'Attachment';

      // Return a list item with an anchor tag inside
      return `
        <li style="margin-bottom: 5px; color: #8cd9d9;">
          <a href="${fileUrl}" target="_blank" style="color: #00d4f0; text-decoration: none;">
            📎 ${fileName}
          </a>
        </li>`;
    }).join('');
    
    attachmentListHtml = `
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #202e3c;">
        <p style="font-size: 12px; font-weight: 600; color: #5aa; margin: 0 0 10px 0; text-transform: uppercase;">
          Attachments included:
        </p>
        <ul style="font-size: 13px; padding-left: 0; list-style: none; margin: 0;">
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
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
    body {
        font-family: 'Montserrat', sans-serif;
        margin: 0px;
        padding: 0px;
        background-color: #fff;
    }
    @media only screen and (max-width: 600px) {
      .mail-wrapper { width: 100% !important; margin: 10px auto !important; }
      .mail-content { padding: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fff;">

<div style="background-color: #fff; padding: 20px 0;">
  <div class="mail-wrapper" style="width: 100%; max-width: 640px; margin: 30px auto;">
    <div style="padding: 20px; background: #101418; border-radius: 4px;">

      <div class="mail-content" style="background: #171f26; padding: 30px; border: 1px solid #202e3c; border-radius: 2px;">
        
        <div style="margin-bottom: 20px; text-align: left;">
          <a href="#" style="display: inline-block;">
            <img src="${logoUrl}" alt="Logo" style="max-width: 100%; height: auto; display: block; border: 0;">
          </a>
        </div>

        <div style="padding: 20px; border-radius: 2px; background: #171f26; border: 1px solid #202e3c; text-align: center; margin-bottom: 25px;">     
          <p style="font-weight: 500; font-size: 16px; line-height: 24px; color: #cff; margin: 0;">
            ${emailSubject}
          </p> 
        </div>

        <div style="color: #8cd9d9; font-size: 14px; line-height: 1.6;">
          <div style="margin-bottom: 20px;">
            ${emailBody}
          </div>
        </div>  

        <!-- Attachment List Section (Added Here) -->
        ${attachmentListHtml}

        <div style="margin-top: 30px; border-top: 1px solid #202e3c; padding-top: 20px;">
          <h3 style="margin: 0px 0px 5px 0px; font-weight: 500; font-size: 16px; color: #cff;">
            Regards,
          </h3>
          <div style="font-size: 14px; color: #00d4f0; line-height: 1.5;">
            ${formattedSignature ? formattedSignature : 'Team NaviLead'}
          </div>
        </div>

      </div>

      <div style="padding: 20px 10px;">
        <ul style="margin: 0px; padding: 0px; list-style: none;">
          <li style="margin-bottom: 15px;">
           <h5 style="margin: 0px 0px 5px 0px; font-size: 13px; font-weight: 600; color: #5aa; text-transform: uppercase;">Security Notice</h5>
           <p style="font-size: 12px; margin: 0px; color: #5f7d8c; line-height: 1.4;">
             This email is intended for the registered user. Please do not share your login credentials or secure links with anyone.
           </p>
          </li>
          <li>
            <h5 style="margin: 0px 0px 5px 0px; font-size: 13px; font-weight: 600; color: #5aa; text-transform: uppercase;">About NaviLead</h5>
            <p style="font-size: 12px; margin: 0px; color: #5f7d8c; line-height: 1.4;">
              Automate your outreach and manage your leads efficiently.
            </p>
          </li>
       </ul>
      </div>

    </div>
  </div>
</div>
</body>
</html>
  `;
};