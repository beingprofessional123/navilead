const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const offersTemplateController = require('../controllers/offersTemplateController');
const authenticate = require('../middleware/authMiddleware');

// Define Multer configuration directly in the router file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadMiddleware = upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'aboutUsLogo', maxCount: 1 }
]);

// Apply authentication middleware to all routes
router.use(authenticate);

// Main offers template routes
router.route('/')
    .get(offersTemplateController.getAllTemplates);

// Individual template routes
router.route('/:id')
    .put(uploadMiddleware, offersTemplateController.updateTemplate);

module.exports = router;