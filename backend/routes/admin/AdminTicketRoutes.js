const express = require('express');
const router = express.Router();
const ticketController = require('../../controllers/admin/ticketController');
const authMiddleware = require("../../middleware/authMiddleware");
const multer = require('multer');
const path = require('path');

// Configure Multer for attachments
const storage = multer.diskStorage({
    destination: './uploads/tickets/',
    filename: (req, file, cb) => {
        cb(null, 'ticket-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.use(authMiddleware);

// Main Ticket Routes
router.get('/', ticketController.getTickets);
router.delete('/:id', ticketController.deleteTicket);

// Chat Message Routes
router.get('/:id/messages', ticketController.getMessages);
router.post('/:id/messages', upload.single('attachment'), ticketController.sendMessage);
router.put('/:id/status', ticketController.updateTicketStatus);
router.post('/update-setting', ticketController.updateSetting);

module.exports = router;