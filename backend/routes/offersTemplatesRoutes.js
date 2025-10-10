const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const offersTemplateController = require('../controllers/offersTemplateController');
const authenticate = require('../middleware/authMiddleware');
const planValidation = require('../middleware/planValidationMiddleware');


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


router.route('/create')
    .post(
        planValidation('Offers_Templates'), // ✅ check limit before creating
        upload.none(),
        offersTemplateController.createTemplates
    );
    
router.route('/:id')
    .get(offersTemplateController.getTemplateById)  // GET single template (for edit)
    .put(uploadMiddleware, offersTemplateController.updateTemplate) // UPDATE
    .delete(offersTemplateController.deleteTemplate); // ✅ DELETE

router.patch('/:id/mark-default', offersTemplateController.markAsDefault);

module.exports = router;