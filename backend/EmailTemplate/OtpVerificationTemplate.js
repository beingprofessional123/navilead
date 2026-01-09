// backend/EmailTemplate/OtpVerificationTemplate.js
module.exports = function OtpVerificationTemplate({ firstName, otpCode }) {
  const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoUrl = `${appUrl}/assets/images/logo.png`;
  const recipientName = firstName || "User";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    body {
      font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
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

    <div style="text-align: center; margin-bottom: 25px;">
      <h2 style="font-size: 20px; color: #111111; margin: 0;">Verify Your Account</h2>
    </div>

    <div style="font-size: 15px; line-height: 1.6; color: #444444; text-align: center;">
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>Please use the following One-Time Password (OTP) to complete your verification. This code is valid for <strong>10 minutes</strong>.</p>

      <div style="margin: 30px 0; padding: 20px; background-color: #f4f4f4; border: 1px dashed #cccccc; border-radius: 6px;">
        <span style="font-size: 36px; letter-spacing: 10px; color: #000000; font-weight: 700; font-family: Courier, monospace;">
          ${otpCode}
        </span>
      </div>

      <p style="font-size: 13px; color: #777777;">
        If you didn’t request this code, you can safely ignore this email.
      </p>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;">
       <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #111;">Best Regards,</h4>
       <p style="font-size: 14px; margin: 0; color: #666;">Team NaviLead</p>
       <p style="font-size: 11px; margin-top: 25px; color: #999999; line-height: 1.4;">
         This is an automated security notification. Please do not reply to this email.
       </p>
    </div>

  </div>
</div>

</body>
</html>
  `;
};