// routes/publicSubscriptionWebhook.js
const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const bodyParser = require("body-parser");

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  subscriptionController.subscriptionRenewWebhook
);

module.exports = router;
