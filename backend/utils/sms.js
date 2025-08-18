const fetch = require('node-fetch');

async function sendSms({ to, message, from }) {
  try {
    // Convert single number to array of objects
    const recipients = Array.isArray(to) ? to : [to];
    const formattedRecipients = recipients.map(msisdn => ({ msisdn }));

    const payload = {
      sender: from,
      message,
      recipients: formattedRecipients,
    };

    const response = await fetch('https://gatewayapi.com/rest/mtsms', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.GATEWAYAPI_TOKEN}`,
      },
    });

    const data = await response.json();

    // Check if any of the messages failed
    if (!response.ok || data.error || data.status === 'failed') {
      throw new Error(`SMS sending failed: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error('GatewayAPI SMS send error:', error);
    throw error;
  }
}

module.exports = { sendSms };
