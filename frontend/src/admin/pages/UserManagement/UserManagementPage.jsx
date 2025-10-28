import React, { useEffect, useState, useContext } from 'react';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import MobileHeader from '../../components/MobileHeader';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const UserManagementPage = () => {
    const { authToken } = useContext(AdminAuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    // Added 'companyName' and 'password' to modalUser state
    const [modalUser, setModalUser] = useState({ id: null, name: '', email: '', phone: '', companyName: '', password: '' });
    const [viewingUser, setViewingUser] = useState(null); // Used to display view-only info
    const { t } = useTranslation();

    // Fetch all users
    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setUsers(res.data.users);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [authToken]); // Added authToken to dependency array

    // Function to reset modal state for adding a new user
    const openAddModal = () => {
        setModalUser({ id: null, name: '', email: '', phone: '', companyName: '', password: '' });
        setViewingUser(null);
        window.bootstrap.Modal.getOrCreateInstance(document.getElementById('myModal')).show();
    };

    // Function to open modal for editing
    const openEditModal = (user) => {
        setModalUser({ ...user, password: '' }); // do not prefill password for security
        setViewingUser(null); // Ensure we are in edit mode
        window.bootstrap.Modal.getOrCreateInstance(document.getElementById('myModal')).show();
    };

    const handleModalChange = (e) => {
        setModalUser({ ...modalUser, [e.target.name]: e.target.value });
    };

    // Function to open modal for viewing
    const viewUser = (user) => {
        setViewingUser(user); // Set viewingUser state
        setModalUser({ id: null, name: '', email: '', phone: '', companyName: '', password: '' }); // Clear modalUser state
        window.bootstrap.Modal.getOrCreateInstance(document.getElementById('myModal')).show();
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure to delete this user?')) return;
        try {
            await api.delete(`/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalUser.id) {
                // Edit user
                await api.put(`/admin/users/${modalUser.id}`, modalUser, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                toast.success('User updated successfully');
            } else {
                // Add new user
                // Basic validation for new user password
                if (!modalUser.password) {
                    toast.error('Password is required for a new user.');
                    return;
                }
                await api.post(`/admin/users`, modalUser, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                toast.success('User created successfully');
            }
            fetchUsers();
            window.bootstrap.Modal.getInstance(document.getElementById('myModal')).hide();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to save user');
        }
    };

    // Update user status
    const updateStatus = async (id, status) => {
        try {
            await api.put(`/admin/users/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success('Status updated');
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    // Compute stats
    const totalUsers = users.length;
    // Assuming 'isNew' is a property from your API
    const newUsers = users.filter(u => u.isNew).length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;
    const totalSmsBalance = users.reduce((acc, u) => acc + (u.smsBalance || 0), 0);

    if (loading) return <div>Loading...</div>;

    return (
        <>
            <div className="mainbody">
                <div className="container-fluid">
                    <MobileHeader />
                    <div className="row top-row">
                        <div className="col-md-6">
                            <div className="dash-heading">
                                <h2>User Management</h2>
                                <p>User Management</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="dashright">
                                {/* Updated to use openAddModal */}
                                <Link to="#" onClick={openAddModal} className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>New User</Link>
                            </div>
                        </div>
                    </div>
                    {/* Stats Row */}
                    <div className="leads-row">
                        <div className="leads-col">
                            <div className="carddesign">
                                <div className="leads-card leads-card1">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg></span>
                                    <h5>Total Users</h5>
                                    <h4>{totalUsers}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="leads-col">
                            <div className="carddesign">
                                <div className="leads-card leads-card2">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true"><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg></span>
                                    <h5>New Users</h5>
                                    <h4>{newUsers}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="leads-col">
                            <div className="carddesign">
                                <div className="leads-card leads-card3">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></span>
                                    <h5>InActive Users</h5>
                                    <h4>{inactiveUsers}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="leads-col">
                            <div className="carddesign">
                                <div className="leads-card leads-card4">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></span>
                                    <h5>Active Users</h5>
                                    <h4>{activeUsers}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="leads-col">
                            <div className="carddesign">
                                <div className="leads-card leads-card5">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true"><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg></span>
                                    <h5>Total SMS Balance</h5>
                                    <h4>{totalSmsBalance}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Users Table */}
                    <div className="row">
                        <div className="col-md-12">
                            <div className="carddesign leadstable">
                                <h2 className="card-title">All Users</h2>
                                <div className="tabledesign">
                                    <div className="table-responsive" style={{ minHeight: "150px", maxHeight: "480px" }}>
                                        <table className="table">
                                            <thead style={{ position: "sticky", top: 0, background: "rgb(22 31 38)", zIndex: 10, }}>
                                                <tr>
                                                    <th className="talechebox"><input className="form-check-input" type="checkbox" id="checkAll" name="checkAll" value="something" /></th>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Phone</th>
                                                    <th>Status</th>
                                                    <th>Plan</th>
                                                    <th>SMS Balance</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((user) => (
                                                    <tr key={user.id}>
                                                        <td className="talechebox"><input className="form-check-input" type="checkbox" id={`check${user.id}`} name={`option${user.id}`} value={user.id} /></td>
                                                        <td><a href="#" onClick={() => viewUser(user)} className="leadlink">{user.name}</a></td>
                                                        <td>{user.email}</td>
                                                        <td>{user.phone}</td>
                                                        <td>
                                                            <div className="dropdown leaddropdown">
                                                                <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                                                                    <span className={`badge ${user.status === 'active' ? 'badge4' : 'badge1'}`}>
                                                                        {user.status}
                                                                    </span>
                                                                </button>
                                                                <ul className="dropdown-menu">
                                                                    <li>
                                                                        <a className="dropdown-item" href="#" onClick={() => updateStatus(user.id, 'active')}>Active</a>
                                                                    </li>
                                                                    <li>
                                                                        <a className="dropdown-item" href="#" onClick={() => updateStatus(user.id, 'inactive')}>InActive</a>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </td>
                                                        <td>{user.plan || 'N/A'}</td>
                                                        <td>{user.smsBalance ?? 0}</td>
                                                        <td className="actionbtn">
                                                            <div className="dropdown leaddropdown">
                                                                <button type="button" className="btn btn-add dropdown-toggle" data-bs-toggle="dropdown">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis m-0" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                                                </button>
                                                                <ul className="dropdown-menu">
                                                                    <li><a className="dropdown-item" href="#" onClick={() => viewUser(user)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>View</a></li>
                                                                    <li><a className="dropdown-item" href="#" onClick={() => openEditModal(user)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>Edit</a></li>
                                                                    <li className="sletborder"><a className="dropdown-item" href="#" onClick={() => deleteUser(user.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 lucide-trash-2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>Delete</a></li>
                                                                </ul>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Modal (Add/Edit/View) */}
            <div className="modal fade modaldesign leadsaddmodal" id="myModal">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            {/* Dynamically set title based on state */}
                            <h4 className="modal-title">
                                {viewingUser ? 'View User' : modalUser.id ? 'Edit User' : 'Add User'}
                                <p>Fill in user information.</p>
                            </h4>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
                        </div>
                        <div className="modal-body">
                            <div className="formdesign">

                                {/* CONDITIONAL RENDERING: VIEW USER MODE */}
                                {viewingUser ? (
                                    <div className="view-user-details">
                                        <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>User Information</h2>
                                        <p><strong>Full Name:</strong> {viewingUser.name}</p>
                                        <p><strong>Email:</strong> {viewingUser.email}</p>
                                        <p><strong>Phone:</strong> {viewingUser.phone}</p>
                                        <p><strong>Company Name:</strong> {viewingUser.companyName || 'N/A'}</p>
                                        <p><strong>Status:</strong> <span className={`badge ${viewingUser.status === 'active' ? 'badge4' : 'badge1'}`}>{viewingUser.status}</span></p>
                                        <p><strong>Plan:</strong> {viewingUser.plan || 'N/A'}</p>
                                        <p><strong>SMS Balance:</strong> {viewingUser.smsBalance ?? 0}</p>
                                        <div className="modalfooter btn-right">
                                            <button type="button" className="btn btn-add" data-bs-dismiss="modal">Close</button>
                                        </div>
                                    </div>

                                ) : (
                                    /* CONDITIONAL RENDERING: ADD/EDIT FORM MODE */
                                    <form onSubmit={handleModalSubmit}>
                                        <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>User information</h2>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Full Name *</label>
                                                    {/* Added name="name" */}
                                                    <input type="text" className="form-control" name="name" value={modalUser.name} onChange={handleModalChange} required placeholder="Enter Full Name" />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Company Name</label>
                                                    {/* Added name="companyName" */}
                                                    <input type="text" className="form-control" name="companyName" value={modalUser.companyName} onChange={handleModalChange} placeholder="Enter Company Name" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Phone number *</label>
                                                    <div className="inputicon">
                                                        {/* Added name="phone" */}
                                                        <input type="text" className="form-control" name="phone" value={modalUser.phone} onChange={handleModalChange} required placeholder="Enter Phone number" />
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Email address *</label>
                                                    <div className="inputicon">
                                                        {/* Added name="email" */}
                                                        <input type="email" className="form-control" name="email" value={modalUser.email} onChange={handleModalChange} required placeholder="Enter email address" />
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            {/* Password is required for Add, optional for Edit */}
                                            {(!modalUser.id || modalUser.password !== null) && (
                                                <div className="col-md-12">
                                                    <div className="form-group">
                                                        <label>Password {modalUser.id ? '(Leave blank to keep current)' : '*'}</label>
                                                        <div className="inputicon">
                                                            {/* Added name="password" */}
                                                            <input type="password" className="form-control" name="password" value={modalUser.password} onChange={handleModalChange} placeholder={modalUser.id ? '**********' : 'Enter Password'} required={!modalUser.id} />
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="modalfooter btn-right">
                                            {/* Changed Link to button/anchor with data-bs-dismiss */}
                                            <a href="#" className="btn btn-add" data-bs-dismiss="modal">Cancel</a>
                                            <button type="submit" className="btn btn-send">{modalUser.id ? 'Update' : 'Save'}</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserManagementPage;