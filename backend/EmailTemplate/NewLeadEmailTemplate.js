module.exports = ({
  fullName,
  email,
  phone,
  address,
  companyName,
  cvrNumber,
  value,
  attachments = [],
}) => {
  // Setup URLs for consistent branding
  const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoUrl = `${appUrl}/assets/images/logo.png`;

  // Format Value (Currency/Rounding)
  const formattedValue = value !== null && !isNaN(value) 
    ? Number(value).toFixed(2) 
    : "-";

  // Attachments Logic
  const attachmentHtml = attachments.length
    ? `
      <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eeeeee;">
        <p style="font-size: 12px; font-weight: bold; color: #888888; margin-bottom: 10px; text-transform: uppercase;">Attachments:</p>
        <ul style="padding: 0; margin: 0; list-style: none;">
          ${attachments.map(file => `
            <li style="margin-bottom: 8px;">
              <a href="${file.url}" target="_blank" style="color: #0066cc; text-decoration: underline; font-size: 14px;">
                📎 ${file.originalname}
              </a>
            </li>
          `).join("")}
        </ul>
      </div>
    ` : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style type="text/css">
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; color: #333; }
  </style>
</head>
<body style="background-color: #f9f9f9; padding: 20px;">

  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">
    
    <div style="padding: 40px;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${logoUrl}" alt="Logo" style="width: 150px; height: auto;">
      </div>

      <div style="border-bottom: 2px solid #f4f4f4; padding-bottom: 15px; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 20px; color: #111;">New Lead Notification</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">A new lead has been generated in the system.</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #777; width: 140px;">Full Name:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #111; font-weight: 600;">${fullName || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #777;">Email:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #0066cc;">${email || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #777;">Phone:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #111;">${phone || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #777;">Company:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #111;">${companyName || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #777;">CVR Number:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #111;">${cvrNumber || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #777;">Lead Value:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f9f9f9; color: #111; font-weight: 700;">${formattedValue}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #777; vertical-align: top;">Address:</td>
          <td style="padding: 10px 0; color: #111; line-height: 1.5;">${address || "-"}</td>
        </tr>
      </table>

      ${attachmentHtml}

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;">
        <p style="font-size: 12px; color: #999;">
          This is an automated notification from your CRM.
        </p>
        <p style="font-size: 14px; font-weight: 600; color: #111; margin-top: 10px;">Team NaviLead</p>
      </div>

    </div>
  </div>

</body>
</html>
  `;
};