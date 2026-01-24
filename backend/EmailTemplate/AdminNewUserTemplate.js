// backend/EmailTemplate/AdminNewUserTemplate.js

module.exports = ({ name, email, phone }) => {

  // 🔁 SAME LOGO LOGIC AS AcceptOfferTemplate
  const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const logoUrl = `${appUrl}/assets/images/logo.png`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
      color: #333;
    }
  </style>
</head>
<body>

  <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:40px; border:1px solid #dddddd; border-radius:4px;">

    <!-- Logo -->
    <div style="text-align:center; margin-bottom:30px;">
      <a href="${appUrl}">
        <img src="${logoUrl}" alt="NaviLead Logo" style="width:150px; height:auto;">
      </a>
    </div>

    <!-- Content -->
    <h2 style="margin-top:0;">New User Registration</h2>

    <p>A new user has registered on <strong>NaviLead</strong>.</p>

    <ul style="padding-left:18px;">
      <li><strong>Name:</strong> ${name}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Phone:</strong> ${phone || 'N/A'}</li>
    </ul>
    <p>Please review the new user details in the admin panel.</p>
  </div>

</body>
</html>
  `;
};
