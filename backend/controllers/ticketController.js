const { Ticket, TicketMessage,User,Settings, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getTickets = async (req, res) => {
    try {
        const userId = req.user.id;

        // Tickets fetch karo with unread message count
        const tickets = await Ticket.findAll({
            where: { userId },
            include: [{
                model: TicketMessage,
                as: 'messages',
                where: { isRead: false, senderType: 'admin' }, // Sirf admin ke unread messages
                required: false
            }],
            order: [['created_at', 'DESC']]
        });

        // Har ticket par unreadCount property set karo
        const ticketsWithCount = tickets.map(ticket => {
            const ticketJson = ticket.toJSON();
            ticketJson.unreadCount = ticket.messages ? ticket.messages.length : 0;
            delete ticketJson.messages; // Messages array ki list mein zarurat nahi
            return ticketJson;
        });

        // Stats logic...
         const stats = {
            total: await Ticket.count({ where: { userId } }),
            open: await Ticket.count({ where: { userId, status: 'Open' } }),
            pending: await Ticket.count({ where: { userId, status: 'Pending' } }),
            resolved: await Ticket.count({ where: { userId, status: 'Resolved' } }),
            responseTime: "1.2h" // This can be calculated or static for now
        };

        res.json({ tickets: ticketsWithCount, stats });
    } catch (error) {
        res.status(500).json({ message: "Error fetching tickets" });
    }
};

exports.createTicket = async (req, res) => {
    try {
        const { subject, category, priority, description } = req.body;
        const userId = req.user.id;
        
        // 1. Generate a random Ticket ID
        const ticket_id = "TIC-" + Math.floor(1000 + Math.random() * 9000);
        
        // 2. Get Backend URL from environment variables
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        // 3. Create Full URL for attachment if file exists
        // req.file.filename use karein kyunki multer storage mein humne filename define kiya hai
        const attachment = req.file 
            ? `${backendUrl}/uploads/tickets/${req.file.filename}` 
            : null;

        // 4. Save to Database
        const newTicket = await Ticket.create({
            ticket_id,
            userId,
            subject,
            category,
            priority,
            description,
            attachment, // Full URL saved here
            status: 'Open'
        });

        res.status(201).json(newTicket);
    } catch (error) {
        console.error("Create Ticket Error:", error);
        res.status(500).json({ message: "Error creating ticket", error });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        await Ticket.destroy({ where: { id, userId: req.user.id } });
        res.json({ message: "Ticket deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed", error });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;
        const isAdmin = currentUserId === 1;

        const messages = await TicketMessage.findAll({
            where: { ticketId: id },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['companyLogo', 'name']
                },
                {
                    model: Ticket,
                    as: 'ticket',
                    attributes: ['status'], // Status fetch kar rahe hain
                    include: [{
                        model: User,
                        as: 'user', // Ticket owner (original user)
                        attributes: ['companyLogo', 'name', 'email']
                    }]
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        const formattedMessages = messages.map(msg => {
            const json = msg.toJSON();
            // Har message ke root par status aur receiver set kar rahe hain
            json.status = json.ticket?.status || 'Open'; 
            json.receiver = json.ticket?.user || null;
            delete json.ticket; // Clean response
            return json;
        });

        // Mark as Read Logic
        const targetSenderType = isAdmin ? 'user' : 'admin';
        await TicketMessage.update(
            { isRead: true },
            { where: { ticketId: id, senderType: targetSenderType, isRead: false } }
        );

        res.json(formattedMessages);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error loading messages" });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        
        // Backend URL from .env
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        // Full path with Environment Variable
        const attachment = req.file 
            ? `${backendUrl}/uploads/tickets/${req.file.filename}` 
            : null;

        const newMessage = await TicketMessage.create({
            ticketId: id,
            senderId: req.user.id,
            senderType: 'user',
            message: message || "", 
            attachment: attachment  // Ab ye full URL save karega
        });

        res.json(newMessage);
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ message: "Error sending message", error });
    }
};

exports.updateSetting = async (req, res) => {
    try {
        const userId = req.user.id;
        const { key, value } = req.body;

        // 1. Agar frontend ne key bheji hai, tabhi update/insert karo
        if (key && value !== undefined) {
            await Settings.upsert({
                userId,
                key: key,
                value: String(value)
            });
        }

        // 2. Defaults Ensure Karein (Jo keys missing hain wo create ho jayengi)
        const defaults = [{ key: 'notificationSoundTickets', value: 'true' }];
        const existingSettings = await Settings.findAll({ where: { userId } });
        const existingKeys = existingSettings.map(s => s.key);

        const toCreate = defaults
            .filter(d => !existingKeys.includes(d.key))
            .map(d => ({ ...d, userId }));

        if (toCreate.length > 0) {
            await Settings.bulkCreate(toCreate);
        }

        // 3. Wapas saari settings bhejein (Latest data)
        const allSettings = await Settings.findAll({ where: { userId } });
        const settingsObj = {};
        allSettings.forEach(s => {
            settingsObj[s.key] = s.value === 'true';
        });

        res.json(settingsObj);
    } catch (error) {
        res.status(500).json({ message: "Sync Error" });
    }
};