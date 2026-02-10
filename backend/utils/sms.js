const fetch = require('node-fetch');

// Normalize phone number: default country code +45
function normalizeMsisdn(number, defaultCountryCode = '+45') {
  if (!number) return number;

  // Remove spaces, brackets, dashes etc
  let cleaned = number.replace(/[^\d+]/g, '');

  // If starts with 00 -> convert to +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // If no country code, add default
  if (!cleaned.startsWith('+')) {
    cleaned = defaultCountryCode + cleaned;
  }

  return cleaned;
}

async function sendSms({ to, message, from }) {
  try {
    // Convert single number to array of objects
    const recipients = Array.isArray(to) ? to : [to];
    const formattedRecipients = recipients.map(msisdn => ({
      msisdn: normalizeMsisdn(msisdn),
    }));

    const payload = {
      sender: from,
      message,
      recipients: formattedRecipients,
    };

    console.log("📤 Sending SMS with payload:", JSON.stringify(payload, null, 2));

    const response = await fetch('https://gatewayapi.com/rest/mtsms', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.GATEWAYAPI_TOKEN}`,
      },
    });

    console.log("📥 Raw response status:", response.status, response.statusText);

    const data = await response.json();

    console.log("📥 Parsed response data:", JSON.stringify(data, null, 2));

    // Log the message IDs (useful for fetching DLR later)
    if (data.ids) {
      console.log("✅ Message IDs:", data.ids.join(", "));
    }

    // Check if any of the messages failed
    if (!response.ok || data.error || data.status === 'failed') {
      throw new Error(`❌ SMS sending failed: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error('🚨 GatewayAPI SMS send error:', error);
    throw error;
  }
}

module.exports = { sendSms };
