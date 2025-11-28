module.exports = function AcceptOfferTemplate({
  salesRepName,
  customerName,
  offerId,
  offerLink,
  totalPrice,
  chosenServices,
  notes,
  signature,
  currency
}) {

  // --- 🛠️ SMART PARSING LOGIC START ---
  let servicesList = [];
const appUrl = process.env.FRONTEND_URL || '#'; // Fallback to '#' if env var is missing
  const logoUrl = `${appUrl}/assets/images/logo.svg`;

    // 3. Format Signature
  const formattedSignature = signature ? signature.replace(/\n/g, '<br>') : '';



  try {
    // Case 1: It's already an Array (Perfect scenario)
    if (Array.isArray(chosenServices)) {
      servicesList = chosenServices;
    } 
    // Case 2: It's a String (The scenario you just shared)
    else if (typeof chosenServices === 'string') {
      
      // Step A: First Parse
      let parsed = JSON.parse(chosenServices);

      // Step B: Handle "Double Stringified" data (Common in some DBs)
      // If the result of the first parse is STILL a string, parse it again.
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }

      // Step C: Assign if it's finally an array
      if (Array.isArray(parsed)) {
        servicesList = parsed;
      }
    }
  } catch (error) {
    console.error("❌ Error parsing chosenServices:", error.message);
    // Fallback: If parsing fails completely, keep list empty to prevent crash
    servicesList = []; 
  }
  // --- 🛠️ SMART PARSING LOGIC END ---


  // 1. Generate HTML List from the parsed array
  const servicesHtml = servicesList && servicesList.length > 0 
    ? servicesList.map(s => `
        <li style="margin-bottom: 15px; border-bottom: 1px solid #202e3c; padding-bottom: 10px;">
          <div style="color: #cff; font-weight: 600; font-size: 15px;">${s.name || 'Service'}</div>
          <div style="color: #8cd9d9; font-size: 13px;">
            Price: ${currency.symbol} ${s.price} ${s.quantity ? `&times; ${s.quantity}` : ''}
          </div>
        </li>
      `).join("") 
    : '<li style="color: #8cd9d9; font-style: italic;">No specific services listed.</li>';

  // 2. Return Final HTML
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <title>Offer Accepted</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style type="text/css">
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
      body { font-family: 'Montserrat', sans-serif; margin: 0px; background: #fff; }
    </style>
  </head>
  <body>

  <div class="mail-messages-body-top" style="width: 640px; margin: 50px auto;">
    <div class="mail-messages-body" style="padding: 20px; background: #101418;">

      <div class="mail-messages" style="background: #171f26; padding: 30px; border: 1px solid #202e3c;">
        
        <div class="mail-logo" style="margin-bottom: 20px;">
          <a href="#" style="display: inline-block; width: 160px;">
            <img src="${logoUrl}" class="img-fluid" alt="Logo" style="max-width: 100%; height: auto;">
          </a>
        </div>

        <div class="mail-docu" style="padding: 20px; border-radius: 2px; background: #171f26; border: 1px solid #202e3c; text-align: center; margin-bottom: 25px;">     
          <p style="font-weight: 600; font-size: 18px; line-height: 24px; color: #00d4f0; margin: 0px;">
            Offer #${offerId} Accepted! 🚀
          </p> 
          <p style="color: #8cd9d9; font-size: 14px; margin-top: 5px;">
            Congratulations, ${salesRepName}!
          </p>
        </div>

        <div class="namemail">
          <h3 style="margin: 0px 0px 5px 0px; font-weight: 500; font-size: 20px; color: #cff;">
            ${customerName}
          </h3>
          
          <p style="font-size: 14px; margin: 0px 0px 15px 0px; color: #8cd9d9;">
            The customer has successfully signed and accepted the offer.
          </p>

          ${notes ? `
            <div style="background: #101418; padding: 15px; border-left: 3px solid #00d4f0; margin-bottom: 20px;">
              <strong style="color: #cff; font-size: 12px; text-transform: uppercase;">Customer Notes:</strong>
              <p style="font-size: 14px; margin: 5px 0px 0px 0px; color: #8cd9d9; font-style: italic;">
                "${notes}"
              </p>
            </div>
          ` : ""}

          <h4 style="color: #cff; border-bottom: 1px solid #202e3c; padding-bottom: 10px; margin-top: 30px;">
            Accepted Services
          </h4>
          
          <ul style="margin: 0px; padding: 0px; list-style: none;">
            ${servicesHtml}
          </ul>

          <div style="margin-top: 20px; text-align: right;">
            <span style="color: #8cd9d9; font-size: 16px;">Total Deal Value: </span>
            <span style="color: #00d4f0; font-size: 22px; font-weight: 700;">${currency.symbol} ${totalPrice}</span>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${offerLink}" target="_blank" style="background-color: #00d4f0; color: #101418; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">
              View Offer Details
            </a>
          </div>

        </div>  
      </div>
      <div class="mail-messages-bottom" style="padding: 30px;">
        <ul style="margin: 0px; padding: 0px; list-style: none;">
          <li style="margin-bottom: 20px;">
           <h5 style="margin: 0px 0px 7px 0px; font-size: 14px; font-weight: 600; color: #cff;">Confidential</h5>
           <p style="font-size: 14px; margin: 0px; color: #8cd9d9;">
             This email contains sensitive sales data. Do not forward outside the organization.
           </p>
          </li>
       </ul>
       
       <div class="footer" style="border-top: 1px solid #202e3c; padding-top: 20px; margin-top: 10px;">
         <h3 style="margin: 0px 0px 7px 0px; font-size: 14px; font-weight: 600; color: #cff;">Regards,</h3>
         
         ${formattedSignature ? `
           <div style="color: #8cd9d9; font-size: 14px;">${formattedSignature}</div>
         ` : `
           <p style="font-size: 14px; margin: 0px; color: #8cd9d9;">${salesRepName}<br>Team Navilead</p>
         `}
      </div> 
      </div>

    </div>
  </div>

  </body>
  </html>
  `;
};