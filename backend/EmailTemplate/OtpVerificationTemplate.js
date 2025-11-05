// backend/EmailTemplate/OtpVerificationTemplate.js
module.exports = function OtpVerificationTemplate({ firstName, otpCode }) {
  const appUrl = process.env.FRONTEND_URL || '#';
  const logoUrl = `${appUrl}/assets/images/logo.svg`;
  const recipientName = firstName || "User";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Verify Your OTP</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Montserrat', sans-serif;
      margin: 0;
      background: #fff;
    }
  </style>
</head>
<body>

<div style="width: 640px; margin: 50px auto; color: rgba(204,255,255,1);">
  <div style="padding: 20px; background: #101418;">
    <div style="background: #171f26; padding: 30px; border: 1px solid #202e3c;">
      <div style="margin-bottom: 20px; text-align: center;">
        <a href="${appUrl}" style="display:inline-block; width:160px;">
          <img src="${logoUrl}" alt="Logo" style="max-width:100%; height:auto;">
        </a>
      </div>

      <div style="padding: 28px 36px; border-radius: 2px; background: #171f26; border: 1px solid #202e3c; text-align: center; margin-bottom: 20px;">
        <p style="font-weight: 500; font-size: 18px; line-height: 26px; color: #cff; margin: 0 0 10px;">
          Hello ${recipientName},
        </p>
        <p style="font-size: 15px; line-height: 24px; color: #8cd9d9; margin: 0 0 15px;">
          Please use the following One-Time Password (OTP) to verify your account. This code is valid for the next <strong>10 minutes</strong>.
        </p>

        <h2 style="font-size: 32px; letter-spacing: 8px; color: #00d4f0; font-weight: 700; margin: 20px 0;">
          ${otpCode}
        </h2>

        <p style="font-size: 14px; color: #8cd9d9; margin: 0;">
          If you didn’t request this code, you can safely ignore this email.
        </p>
      </div>

      <div style="padding-top: 20px; text-align: center; color: #8cd9d9;">
        <h3 style="margin: 0 0 7px; font-size: 14px; font-weight: 600; color: #cff;">Best Regards,</h3>
        <p style="font-size: 14px; margin: 0;">Team NaviLead</p>
        <p style="font-size: 12px; margin: 15px 0 0; color: #555;">
          (You are receiving this email because an OTP verification was requested on NaviLead.)
        </p>
      </div>
    </div>
  </div>
</div>

</body>
</html>
  `;
};
