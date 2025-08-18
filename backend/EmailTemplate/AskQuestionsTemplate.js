// backend/EmailTemplate/AskQuestionsTemplate.js
module.exports = function AskQuestionsTemplate({
  firstName,
  customerFullName,
  offerLink,
  question,
  customerEmail,
}) {
  return `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
      <p>Dear ${firstName || "there"},</p>

      <p>
        You sent an offer to <strong>${customerFullName || "the customer"}</strong> <br />
        for the offer: <a href="${offerLink}" target="_blank" rel="noopener noreferrer">${offerLink}</a>
      </p>

      <p>
        The customer has asked the following question: <br />
        <em>"${question}"</em>
      </p>

      <p>
        You can reply to the customer at: 
        <a href="mailto:${customerEmail}">${customerEmail}</a>
      </p>

      <p>
        Hope this helps. Best wishes for you to grab business with this customer.
      </p>

      <p>
        Regards, <br />
        <strong>Team NaviLead</strong>
      </p>
    </div>
  `;
};
