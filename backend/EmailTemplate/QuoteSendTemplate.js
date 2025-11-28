// backend/EmailTemplate/QuoteSendTemplate.js

module.exports = function QuoteSendTemplate({ emailSubject, emailBody, signature, attachments }) {
  
  // 1. Setup URLs
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoUrl = `${frontendUrl}/assets/images/logo.png`; // Make sure this image exists!

  // 2. Format Body (Convert \n to <br>)
  // We also wrap links in <a> tags if they aren't already
  let formattedBody = emailBody ? emailBody.replace(/\n/g, '<br>') : '';

  // 3. Format Signature
  const formattedSignature = signature ? signature.replace(/\n/g, '<br>') : '';

  // 4. Generate Attachments HTML
  let attachmentHtml = '';
  if (Array.isArray(attachments) && attachments.length > 0) {
    attachmentHtml = `
      <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #202e3c;">
        <h5 style="margin: 0px 0px 10px 0px; font-size: 14px; font-weight: 600; color: #cff;">Attachments:</h5>
        ${attachments.map(att => `
          <a href="${att.path}" target="_blank" style="display: inline-block; margin-bottom: 10px; margin-right: 10px; padding: 8px 15px; font-size: 13px; color: #171f26; background-color: #00d4f0; text-decoration: none; font-weight: 600; border-radius: 2px;">
            ⬇ Download ${att.filename}
          </a>
        `).join('')}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Quote Notification</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
    body { font-family: 'Montserrat', sans-serif; margin: 0px; background: #fff; }
    a { text-decoration: none; }
  </style>
</head>
<body>

<div class="mail-messages-body-top" style="width: 100%; max-width: 640px; margin: 40px auto;">
  <div class="mail-messages-body" style="padding: 20px; background: #101418;">

    <div class="mail-messages" style="background: #171f26; padding: 30px; border: 1px solid #202e3c; border-radius: 4px;">
      
      <div class="mail-logo" style="margin-bottom: 20px; text-align: center;">
        <a href="${frontendUrl}" style="display: inline-block; width: 160px;">
          <img src="${logoUrl}" alt="Logo" style="max-width: 100%; height: auto; display: block;">
        </a>
      </div>

      <div class="mail-docu" style="padding: 20px; border-radius: 2px; background: #171f26; border: 1px solid #202e3c; text-align: center; margin-bottom: 25px;">     
        <p style="font-weight: 600; font-size: 16px; line-height: 24px; color: #cff; margin: 0;">
          ${emailSubject}
        </p> 
      </div>

      <div class="namemail">
        <div style="font-size: 14px; margin: 0px 0px 20px 0px; color: #8cd9d9; line-height: 1.8; word-wrap: break-word;">
          ${formattedBody}
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #202e3c; color: #00d4f0; font-size: 14px; line-height: 1.6;">
           ${formattedSignature}
        </div>

        ${attachmentHtml}
      </div>  

    </div>

    <div class="mail-messages-bottom" style="padding: 20px 30px;">
      <ul style="margin: 0px; padding: 0px; list-style: none;">
        <li style="margin-bottom: 15px;">
         <h5 style="margin: 0px 0px 5px 0px; font-size: 13px; font-weight: 600; color: #cff;">Note</h5>
         <p style="font-size: 13px; margin: 0px; color: #8cd9d9;">Please do not reply directly to this automated email.</p>
        </li>
     </ul>
     
     <div class="footer" style="margin-top: 20px;">
       <h3 style="margin: 0px 0px 5px 0px; font-size: 13px; font-weight: 600; color: #cff;">Regards</h3>
       <p style="font-size: 13px; margin: 0px; color: #8cd9d9;">Team NaviLead</p>
    </div> 
    </div>

  </div>
</div>

</body>
</html>
  `;
};