const express = require("express");
const router = express.Router();
const leadController = require("../controllers/leadController");
const authMiddleware = require("../middleware/authMiddleware");
const planValidation = require('../middleware/planValidationMiddleware');
const multer = require("multer");

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // make sure folder exists
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Protect all routes
router.use(authMiddleware);

// Routes
router.get("/", leadController.getAllLeads);
router.post("/",planValidation('Leads'), upload.array("attachments"), leadController.createLead);
router.get("/:id", leadController.getLeadById);
router.put("/:id", upload.array("attachments"), leadController.updateLead);
router.delete("/:id", leadController.deleteLead);

module.exports = router;
