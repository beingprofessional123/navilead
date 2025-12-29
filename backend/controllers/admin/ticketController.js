const { Ticket, TicketMessage,User,Settings, sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.getTickets = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const isAdmin = currentUserId === 1;

        // Admin (ID 1) ke liye filter empty {}, User ke liye filter {userId}
        const filter = isAdmin ? {} : { userId: currentUserId };

        const tickets = await Ticket.findAll({
            where: filter,
            include: [
                {
                    model: TicketMessage,
                    as: 'messages',
                    // Agar admin hai to 'user' ke unread messages dikhao, agar user hai to 'admin' ke
                    where: { 
                        isRead: false, 
                        senderType: isAdmin ? 'user' : 'admin' 
                    },
                    required: false
                },
                {
                    model: User,
                    as: 'user', // Admin view mein client ka naam dikhane ke liye
                    attributes: ['name', 'companyLogo']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const ticketsWithCount = tickets.map(ticket => {
            const ticketJson = ticket.toJSON();
            ticketJson.unreadCount = ticket.messages ? ticket.messages.length : 0;
            delete ticketJson.messages;
            return ticketJson;
        });

        const statsFilter = isAdmin ? {} : { userId: currentUserId };
        const stats = {
            total: await Ticket.count({ where: statsFilter }),
            open: await Ticket.count({ where: { ...statsFilter, status: 'Open' } }),
            pending: await Ticket.count({ where: { ...statsFilter, status: 'Pending' } }),
            resolved: await Ticket.count({ where: { ...statsFilter, status: 'Resolved' } }),
            responseTime: "1.2h"
        };

        res.json({ tickets: ticketsWithCount, stats });
    } catch (error) {
        res.status(500).json({ message: "Error fetching tickets" });
    }
};



// DELETE TICKET
exports.deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const isAdmin = req.user.id === 1;

        // Admin kisi bhi ID ko delete kar sakta hai, User sirf apni
        const deleteFilter = isAdmin ? { id } : { id, userId: req.user.id };

        await Ticket.destroy({ where: deleteFilter });
        res.json({ message: "Ticket deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed" });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const currentUserId = req.user.id;
        const isAdmin = currentUserId === 1;
        
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
        const attachment = req.file ? `${backendUrl}/uploads/tickets/${req.file.filename}` : null;

        // Message Create karein
        const createdMessage = await TicketMessage.create({
            ticketId: id,
            senderId: currentUserId,
            senderType: isAdmin ? 'admin' : 'user',
            message: message || "", 
            attachment: attachment
        });

        // Ab Sender aur Receiver (Ticket Owner) ki details fetch karein response ke liye
        const newMessage = await TicketMessage.findOne({
            where: { id: createdMessage.id },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['companyLogo', 'name']
                },
                {
                    model: Ticket,
                    as: 'ticket',
                    attributes: ['id'],
                    include: [{
                        model: User,
                        as: 'user', // Ticket owner (Receiver for admin)
                        attributes: ['companyLogo', 'name', 'email']
                    }]
                }
            ]
        });

        const responseData = newMessage.toJSON();
        responseData.receiver = responseData.ticket?.user || null;
        delete responseData.ticket;

        res.json(responseData);
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ message: "Error sending message", error });
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

exports.updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Security check: Only Admin (ID: 1)
        if (req.user.id !== 1) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        await Ticket.update({ status }, { where: { id } });
        res.json({ message: "Status updated", status });
    } catch (error) {
        res.status(500).json({ message: "Update failed" });
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