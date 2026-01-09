import React, { useContext, useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";
import { AuthContext } from '../../context/AuthContext';
import api from '../../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import Swal from 'sweetalert2';

const TicketPage = () => {
    const { t } = useTranslation();
    const { authToken } = useContext(AuthContext);
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({ total: 0, open: 0, pending: 0, resolved: 0, responseTime: "0h" });
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const notificationSound = new Audio('/NotificationSound.mp3');

    // 🛠️ Unified Function: Fetch aur Update dono ke liye
    const handleSoundSync = async (toggleValue = null) => {
        try {
            const payload = {};

            // Agar toggleValue pass kiya hai, to update mode
            if (toggleValue !== null) {
                payload.key = 'notificationSoundTickets';
                payload.value = String(toggleValue);
            }

            const res = await api.post('/tickets/update-setting', payload,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );


            // Backend se hamesha latest settings aayengi
            const soundStatus = res.data.notificationSoundTickets;
            setIsSoundEnabled(soundStatus);

            if (toggleValue !== null) {
                toast.success(soundStatus ? "Sound Enabled" : "Sound Muted");
            }
        } catch (error) {
            console.error("Sync Error:", error);
            if (toggleValue !== null) toast.error("Failed to save setting");
        }
    };

    const toggleSound = () => {
        const nextValue = !isSoundEnabled;
        handleSoundSync(nextValue); // Argument pass kiya = Update + Fetch
    };

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    useEffect(() => {
        const mainInterval = setInterval(async () => {
            try {
                // 1. Fetch Latest Tickets
                const ticketRes = await api.get('/tickets', {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                const tickets = ticketRes.data.tickets || [];
                setTickets(tickets);

                // 2. Change Detection Logic
                const lastSnapshot = JSON.parse(localStorage.getItem('ticketSnapshot') || '[]');

                // 💡 ticket_id ko snapshot mein add kiya gaya hai
                const currentSnapshot = tickets.map(t => ({
                    id: t.id,
                    ticket_id: t.ticket_id, // TIC-5128 format
                    status: t.status,
                    unread: t.unreadCount
                }));

                if (lastSnapshot.length > 0) {
                    const isNewTicket = currentSnapshot.length > lastSnapshot.length;
                    const isDeleted = currentSnapshot.length < lastSnapshot.length;

                    // Kisi doosri ticket mein badlav dhoondein
                    const changedTicket = currentSnapshot.find(curr => {
                        const prev = lastSnapshot.find(p => p.id === curr.id);
                        const isNotCurrentChat = selectedTicket ? curr.id !== selectedTicket.id : true;
                        return prev && isNotCurrentChat && (prev.status !== curr.status || curr.unread > prev.unread);
                    });

                    if (isNewTicket || isDeleted || changedTicket) {
                        let alertMsg = "Tickets list updated!";

                        if (isNewTicket) {
                            // Naye ticket ka ticket_id dikhayein
                            const newTicketData = currentSnapshot.find(curr => !lastSnapshot.some(prev => prev.id === curr.id));
                            alertMsg = `📩 New Ticket Received: ${newTicketData?.ticket_id || ''}`;
                        }
                        else if (isDeleted) {
                            alertMsg = "🗑️ A ticket was removed.";
                        }
                        else if (changedTicket) {
                            const prevVersion = lastSnapshot.find(p => p.id === changedTicket.id);

                            // 🔔 Yahan humne ticket_id (TIC-5128) use kiya hai
                            alertMsg = changedTicket.status !== prevVersion?.status
                                ? `🔄 Ticket ${changedTicket.ticket_id} status: ${changedTicket.status}`
                                : `💬 New message in ${changedTicket.ticket_id}`;
                        }

                        if (isSoundEnabled) {
                            notificationSound.play().catch(e => console.log("Audio Error:", e));
                        }

                        toast.info(alertMsg);

                        if (Notification.permission === "granted") {
                            new Notification("Support Alert", { body: alertMsg });
                        }
                    }
                }

                // 3. Update Current Chat Modal
                if (isChatModalOpen && selectedTicket) {
                    const msgRes = await api.get(`/tickets/${selectedTicket.id}/messages`, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    setChatMessages(msgRes.data);
                }

                // 4. Update Memory
                localStorage.setItem('ticketSnapshot', JSON.stringify(currentSnapshot));
                const currentTotalUnread = tickets.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
                localStorage.setItem('prevUnreadCount', currentTotalUnread);

            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 4000);

        return () => clearInterval(mainInterval);
    }, [isChatModalOpen, selectedTicket?.id, isSoundEnabled, authToken]);



    // --- Fetch Data ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tickets', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            setTickets(response.data.tickets || []);
            setStats(response.data.stats || stats);
        } catch (error) {
            toast.error(t('Failed to load data'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSoundSync();
        fetchData();
    }, []);

    // --- Handlers ---
    const toggleNewTicketModal = (e) => { if (e) e.preventDefault(); setIsNewTicketModalOpen(!isNewTicketModalOpen); };

    const toggleChatModal = (e) => {
        if (e) e.preventDefault();
        setIsChatModalOpen(!isChatModalOpen);
        if (isChatModalOpen) setSelectedTicket(null);
    };

    const handleOpenChat = async (ticket) => {
        setSelectedTicket(ticket);
        setIsChatModalOpen(true);
        try {
            const response = await api.get(
                `/tickets/${ticket.id}/messages`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            setChatMessages(response.data || []);
        } catch (error) {
            toast.error(t('Error loading messages'));
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();

        // 1. Loading state start (Optional: button disable karne ke liye)
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            // 2. FormData create karein (Ye automatic saare input names 'subject', 'category' etc. pick kar lega)
            const formData = new FormData(e.target);

            // 3. API Call (Multipart request automatically set ho jayegi)
            await api.post('/tickets', formData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            // 4. Success Handling
            toast.success(t('Ticket Created successfully!'));

            // Modal close karein
            setIsNewTicketModalOpen(false);

            // List refresh karein
            fetchData();

            // Form reset karein
            e.target.reset();

        } catch (error) {
            console.error("Create Ticket Error:", error);
            toast.error(error.response?.data?.message || t('Failed to create ticket'));
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        // Agar text aur file dono khali hain toh kuch mat karo
        if (!newMessage.trim() && !selectedFile) return;

        try {
            // 1. FormData object create karo (Yeh request ko 'Form' format mein convert karta hai)
            const formData = new FormData();

            // 2. Data add karo
            formData.append('message', newMessage);

            if (selectedFile) {
                formData.append('attachment', selectedFile); // 'attachment' name backend multer se match hona chahiye
            }

            // 3. API call karo (Headers mein Content-Type automatic set ho jayega)
            const response = await api.post(
                `/tickets/${selectedTicket.id}/messages`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            // Success: UI update karo
            setChatMessages([...chatMessages, response.data]);

            // 4. Form clear karo
            setNewMessage("");
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(t('Failed to send message'));
        }
    };

    const handleDeleteTicket = async (id) => {
        Swal.fire({
            title: t('Are you sure?'),
            text: t('You will not be able to recover this ticket!'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('Yes, delete it!'),
            cancelButtonText: t('Cancel'),
            customClass: {
                popup: 'custom-swal-popup'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // API call to delete the ticket
                    await api.delete(`/tickets/${id}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });

                    toast.success(t('Ticket deleted successfully'));
                    fetchData(); // Tickets list refresh karne ke liye
                } catch (err) {
                    console.error('Error deleting ticket:', err);
                    toast.error(t('Failed to delete ticket'));
                }
            }
        });
    };

    return (
        <div className="mainbody">
            <div className="container-fluid">
                <MobileHeader />

                <div className="row top-row">
                    <div className="col-md-6">
                        <div className="dash-heading">
                            <h2>{t('Support Tickets')}</h2>
                            <p>{t('Manage and resolve all your support inquiries')}</p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="dashright">
                            <button
                                className="btn btn-add"
                                onClick={toggleSound}
                                title={isSoundEnabled ? t('Mute Sound') : t('Unmute Sound')}
                                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '14px' }}
                            >
                                {isSoundEnabled ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" style={{ marginRight: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-2">
                                        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" style={{ marginRight: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-x">
                                        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                                        <line x1="22" y1="9" x2="16" y2="15"></line>
                                        <line x1="16" y1="9" x2="22" y2="15"></line>
                                    </svg>
                                )}
                            </button>
                            <button className="btn btn-send" onClick={toggleNewTicketModal}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                {t('New Ticket')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div className="leads-row">
                    {/* Total Tickets */}
                    <div className="leads-col">
                        <div className="carddesign">
                            <div className="leads-card leads-card1">
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ticket">
                                        <path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"></path>
                                        <path d="M2 15v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4"></path>
                                        <path d="M2 9a3 3 0 0 1 0 6"></path>
                                        <path d="M22 9a3 3 0 0 0 0 6"></path>
                                    </svg>
                                </span>
                                <h5>{t('Total Tickets')}</h5>
                                <h4>{stats.total || 0}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Open Tickets */}
                    <div className="leads-col">
                        <div className="carddesign">
                            <div className="leads-card leads-card2">
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </span>
                                <h5>{t('Open')}</h5>
                                <h4>{stats.open || 0}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Pending Tickets */}
                    <div className="leads-col">
                        <div className="carddesign">
                            <div className="leads-card leads-card3">
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <circle cx="12" cy="12" r="6"></circle>
                                        <circle cx="12" cy="12" r="2"></circle>
                                    </svg>
                                </span>
                                <h5>{t('Pending')}</h5>
                                <h4>{stats.pending || 0}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Resolved Tickets */}
                    <div className="leads-col">
                        <div className="carddesign">
                            <div className="leads-card leads-card4">
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                </span>
                                <h5>{t('Resolved')}</h5>
                                <h4>{stats.resolved || 0}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Response Time */}
                    <div className="leads-col">
                        <div className="carddesign">
                            <div className="leads-card leads-card5">
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up">
                                        <path d="M16 7h6v6"></path>
                                        <path d="m22 7-8.5 8.5-5-5L2 17"></path>
                                    </svg>
                                </span>
                                <h5>{t('Response Time')}</h5>
                                <h4>{stats.responseTime || '0h'}</h4>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Table Section */}
                <div className="row">
                    <div className="col-md-12">
                        <div className="carddesign leadstable">
                            <h2 className="card-title">{t('All Support Tickets')}</h2>
                            <div className="tabledesign">
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>{t('Ticket ID')}</th>
                                                <th>{t('Subject')}</th>
                                                <th>{t('Category')}</th>
                                                <th>{t('Status')}</th>
                                                <th>{t('Priority')}</th>
                                                <th>{t('Opened Date')}</th>
                                                <th>{t('Actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.length > 0 ? (
                                                tickets.map((ticket) => (
                                                    <tr key={ticket.id}>
                                                        <td>
                                                            <a href="#" className="leadlink" onClick={(e) => { e.preventDefault(); handleOpenChat(ticket); }}>
                                                                #{ticket.ticket_id}
                                                            </a>
                                                        </td>
                                                        <td>
                                                            <strong>{t(ticket.subject)}</strong>
                                                        </td>
                                                        <td>{ticket.category}</td>
                                                        <td>
                                                            {/* Status ke hisaab se dynamic badge class */}
                                                            <span className={`badge ${ticket.status === 'Open' ? 'bg-primary' :
                                                                ticket.status === 'Resolved' ? 'bg-success' :
                                                                    ticket.status === 'Pending' ? 'bg-warning text-dark' : 'bg-secondary'
                                                                }`}>
                                                                {t(ticket.status)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {/* Priority ke hisaab se dynamic badge class */}
                                                            <span className={`badge ${ticket.priority === 'High' || ticket.priority === 'Urgent' ? 'bg-danger' :
                                                                ticket.priority === 'Medium' ? 'bg-info' : 'bg-success'
                                                                }`}>
                                                                {t(ticket.priority)}
                                                            </span>
                                                        </td>
                                                        <td>{new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                        <td className="actionbtn">
                                                            <div className="d-flex align-items-center">
                                                                {/* Chat Button - Dynamic logic */}
                                                                <a href="#" className="position-relative me-3" onClick={(e) => { e.preventDefault(); handleOpenChat(ticket); }}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square">
                                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                                    </svg>
                                                                    {/* Message count agar backend se mil raha hai toh show hoga */}
                                                                    {ticket.unreadCount > 0 && (
                                                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                                                            {ticket.unreadCount}
                                                                        </span>
                                                                    )}
                                                                </a>

                                                                {/* Delete Button - Dynamic logic */}
                                                                <a href="#" className="text-danger" onClick={(e) => { e.preventDefault(); handleDeleteTicket(ticket.id); }}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                                                        <path d="M3 6h18"></path>
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                                        <line x1="10" x2="10" y1="11" y2="17"></line>
                                                                        <line x1="14" x2="14" y1="11" y2="17"></line>
                                                                    </svg>
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center p-4">
                                                        {loading ? t('Loading...') : t('No support tickets found')}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {isNewTicketModalOpen && (
                <div className="modal fade modaldesign leadsaddmodal show" id="myModal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                    <div className="modal-dialog">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h4 className="modal-title">Create New Ticket<p>Fill in ticket details and information</p></h4>
                                <button type="button" className="btn-close" onClick={toggleNewTicketModal}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="formdesign">
                                    {/* Form Submission Handle karne ke liye handleCreateTicket lagaya */}
                                    <form onSubmit={handleCreateTicket}>
                                        <h2 className="card-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                            Ticket Details
                                        </h2>

                                        {/* Subject Field - name="subject" added */}
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label>Subject *</label>
                                                    <input type="text" name="subject" className="form-control" placeholder="Enter ticket subject" required />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Category & Priority Row - names added */}
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Category *</label>
                                                    <div className="inputselect">
                                                        <select name="category" className="form-select" required>
                                                            <option value="">Select Category</option>
                                                            <option value="Technical Issue">Technical Issue</option>
                                                            <option value="Feature Request">Feature Request</option>
                                                            <option value="Billing Inquiry">Billing Inquiry</option>
                                                            <option value="General Question">General Question</option>
                                                            <option value="Bug Report">Bug Report</option>
                                                            <option value="Access Problem">Access Problem</option>
                                                        </select>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Priority *</label>
                                                    <div className="inputselect">
                                                        <select name="priority" className="form-select" required>
                                                            <option value="Low">Low</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="High">High</option>
                                                            <option value="Urgent">Urgent</option>
                                                        </select>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description Field - name="description" added */}
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label>Description</label>
                                                    <div className="inputicon">
                                                        <textarea name="description" className="form-control" rows="4" placeholder="Describe the issue in detail..."></textarea>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle" aria-hidden="true"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* File Upload Field - name="attachment" added */}
                                        <div className="form-group">
                                            <label className="form-label">Upload Files (Optional)</label>
                                            <div className="upload-files-container">
                                                <div className="drag-file-area">
                                                    <span className="material-icons-outlined upload-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload w-8 h-8 text-muted-foreground" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                                                    </span>
                                                    <label className="label">
                                                        <span className="browse-files">
                                                            <input type="file" name="attachment" className="default-file-input" />
                                                            <span className="browse-files-text">Click to upload files</span>
                                                        </span>
                                                    </label>
                                                    <h3 className="dynamic-message">PDF, DOC, JPG, PNG up to 10MB</h3>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons - type="submit" added */}
                                        <div className="modalfooter btn-right">
                                            <button type="button" className="btn btn-add" onClick={toggleNewTicketModal}>Cancel</button>
                                            <button type="submit" className="btn btn-send">Create Ticket</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isChatModalOpen && selectedTicket && (
                <div className="modal fade modaldesign show" id="chatModal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-lg" style={{ maxWidth: '900px' }}>
                        <div className="modal-content">

                            <div className="modal-header">
                                <h4 className="modal-title">Ticket Details<p>View information and conversation history</p></h4>
                                <button type="button" className="btn-close" onClick={toggleChatModal}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="formdesign">
                                    <form onSubmit={handleSendMessage}>
                                        <h2 className="card-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ticket" aria-hidden="true"><path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"></path><path d="M2 15v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4"></path><path d="M2 9a3 3 0 0 1 0 6"></path><path d="M22 9a3 3 0 0 0 0 6"></path></svg>
                                            Ticket Information
                                        </h2>

                                        {/* Ticket Details - Dynamic Data */}
                                        <div className="row mb-2">
                                            <div className="col-md-8 mb-2">
                                                <label className="mb-0">Subject</label>
                                                <div className="small">{selectedTicket.subject}</div>
                                            </div>
                                            <div className="col-md-4 mb-2">
                                                <label className="mb-0">Attachment</label>
                                                <div className="small">{selectedTicket.attachment ? <a href={selectedTicket.attachment} target="_blank" rel="noopener noreferrer">View Attachment</a> : 'No attachment'}</div>
                                            </div>
                                            <div className="col-md-3 mb-2">
                                                <label className="mb-0">Category</label>
                                                <div className="small">{selectedTicket.category}</div>
                                            </div>
                                            <div className="col-md-3 mb-2">
                                                <label className="mb-0">Priority</label>
                                                <div className="small">{selectedTicket.priority}</div>
                                            </div>
                                            <div className="col-md-3 mb-2">
                                                <label className="mb-0">Date</label>
                                                <div className="small">{new Date(selectedTicket.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div className="col-md-3 mb-2">
                                                <label className="mb-0">Status</label>
                                                <div>
                                                    <span className={`badge ${chatMessages[0]?.status === 'Closed' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}`}>
                                                        {chatMessages[0]?.status || selectedTicket?.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-md-12 mb-2">
                                                <label className="mb-0">Description</label>
                                                <div className="small">{selectedTicket.description || 'No description provided.'}</div>
                                            </div>
                                        </div>

                                        <div className="bordermid"></div>

                                        {/* Chat Section */}
                                        <h2 className="card-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                            Chat History
                                        </h2>

                                        {/* Chat Messages */}
                                        <div className="chat-box-wrapper mb-3" style={{ maxHeight: '350px', overflowY: 'auto', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>

                                            {chatMessages.length > 0 ? (
                                                <>
                                                    {chatMessages.map((msg, index) => (
                                                        <div key={index} className={`d-flex align-items-start mb-3 ${msg.senderType === 'user' ? 'justify-content-end' : ''}`}>
                                                            {msg.senderType !== 'user' && (
                                                                <div className="avatar me-2" style={{ minWidth: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', background: '#007bff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    {/* Admin logo agar system mein hai toh wahi, warna default icon */}
                                                                    {msg.sender?.companyLogo ? (
                                                                        <img
                                                                            src={msg.sender.companyLogo}
                                                                            alt="ME"
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = 'ME'; }}
                                                                        />
                                                                    ) : (
                                                                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                                                                            {msg.sender?.name
                                                                                ? msg.sender.name
                                                                                    .split(' ')            // Name ko space se todta hai ['Deeepak', 'Apurva']
                                                                                    .map(n => n[0])        // Har word ka pehla character leta hai ['D', 'A']
                                                                                    .join('')              // Wapas jod deta hai 'DA'
                                                                                    .toUpperCase()         // Capital letter mein convert karta hai
                                                                                    .slice(0, 2)           // Max 2 characters hi dikhata hai
                                                                                : '??'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className={`msg`} style={{ maxWidth: '75%' }}>
                                                                <div className="p-2 rounded shadow-sm border" style={{ fontSize: '13px' }}>
                                                                    {msg.message}
                                                                </div>
                                                                {/* Dynamic Attachment logic based on your design */}
                                                                {msg.attachment && (
                                                                    <div className={`mt-2 p-2 border rounded d-flex align-items-center ${msg.senderType === 'user' ? 'justify-content-end' : ''}`} style={{ width: 'fit-content', marginLeft: msg.senderType === 'user' ? 'auto' : '0', marginRight: msg.senderType === 'admin' ? 'auto' : '0' }}>
                                                                        {msg.senderType !== 'user' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2 text-primary"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>}
                                                                        <a href={msg.attachment} target="_blank" rel="noreferrer" style={{ fontSize: '11px', textDecoration: 'none', color: '#02d4f0' }}>View File</a>
                                                                        {msg.senderType === 'user' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ms-2 text-primary"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>}
                                                                    </div>
                                                                )}
                                                                <small
                                                                    className={`d-block mt-1 ${msg.senderType === 'admin' ? 'text-start' : 'text-end'}`}
                                                                    style={{ fontSize: '10px', color: '#888' }}
                                                                >
                                                                    {new Date(msg.created_at || msg.createdAt).toLocaleString('en-US', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    })}
                                                                </small>
                                                            </div>
                                                            {msg.senderType === 'user' && (
                                                                <div className="avatar ms-2" style={{ minWidth: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', background: '#6c757d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    {msg.sender?.companyLogo ? (
                                                                        <img
                                                                            src={msg.sender.companyLogo}
                                                                            alt="ME"
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = 'ME'; }}
                                                                        />
                                                                    ) : (
                                                                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                                                                            {msg.sender?.name
                                                                                ? msg.sender.name
                                                                                    .split(' ')            // Name ko space se todta hai ['Deeepak', 'Apurva']
                                                                                    .map(n => n[0])        // Har word ka pehla character leta hai ['D', 'A']
                                                                                    .join('')              // Wapas jod deta hai 'DA'
                                                                                    .toUpperCase()         // Capital letter mein convert karta hai
                                                                                    .slice(0, 2)           // Max 2 characters hi dikhata hai
                                                                                : '??'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div ref={chatEndRef} />
                                                </>
                                            ) : (
                                                /* --- No Chat Found Message --- */
                                                <div className="text-center d-flex flex-column align-items-center justify-content-center h-100 py-4" style={{ opacity: 0.6 }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                                    <p style={{ fontSize: '14px' }}>{t('No chat history found')}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Reply Input Section */}
                                        {['Open', 'Pending'].includes(chatMessages[0]?.status || selectedTicket?.status) ? (
                                            <div className="form-group">
                                                <div className="inputadd">
                                                    <div className="position-relative d-flex align-items-center" style={{ flex: 1 }}>
                                                        <span className="position-absolute start-0 ms-3">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                                        </span>

                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Type your message..."
                                                            style={{ paddingLeft: '45px', paddingRight: '50px' }}
                                                            value={newMessage}
                                                            onChange={(e) => setNewMessage(e.target.value)}
                                                        />

                                                        <label className="position-absolute end-0 me-3 mb-0 cursor-pointer" style={{ cursor: 'pointer', right: '10px' }}>
                                                            <input
                                                                type="file"
                                                                hidden
                                                                ref={fileInputRef}
                                                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                                            />

                                                            {/* Badge Count - Dynamic (Sirf tab dikhega jab file select hogi) */}
                                                            {selectedFile && (
                                                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px', padding: '2px 5px', marginTop: '-5px' }}>
                                                                    1
                                                                </span>
                                                            )}

                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip">
                                                                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                                            </svg>
                                                        </label>
                                                    </div>

                                                    <button type="submit" className="btn btn-send">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send m-0">
                                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* --- Ticket Closed/Resolved Message --- */
                                            <div className="text-center p-3 rounded shadow-sm border" style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2 text-warning">
                                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                                <span style={{ fontSize: '13px', fontWeight: '600' }}>
                                                    {chatMessages.length > 0 && chatMessages[0].status || selectedTicket?.status === 'Resolved'
                                                        ? t('This ticket has been marked as Resolved. Chat is now disabled.')
                                                        : t('This ticket has been Closed. You cannot send further messages.')}
                                                </span>
                                            </div>
                                        )}

                                        <div className="modalfooter btn-right mt-3">
                                            <button type="button" className="btn btn-add" onClick={toggleChatModal}>Close</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketPage;