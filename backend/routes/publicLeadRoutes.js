const express = require("express");
const router = express.Router();
const leadController = require("../controllers/leadController");
const multer = require("multer");
const path = require("path");

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter (jpg, jpeg, pdf, doc, docx)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .jpeg, .pdf, and .doc/.docx files are allowed"));
  }
};

// Multer upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB per file
});

// Routes
// 👉 POST with attachments
router.post("/", upload.array("attachments"), leadController.createPublicLead);

// 👉 GET without attachments
router.get("/", leadController.createPublicLead);

module.exports = router;
