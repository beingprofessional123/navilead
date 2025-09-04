import React, { useState, useEffect, useContext } from 'react';
import MobileHeader from '../../components/common/MobileHeader';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const WorkflowsPage = () => {
    const { t } = useTranslation();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(false);

    // fetch workflows
    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const res = await api.get('/workflows');
            setWorkflows(res.data);
        } catch (err) {
            console.error(err);
            toast.error(t('Failed to load workflows'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    return (
        <>
            <div className="mainbody">
                <div className="container-fluid">
                    <MobileHeader />
                    <div className="row top-row">
                        <div className="col-md-6">
                            <div className="dash-heading">
                                <h2>{t('workflows.pageTitle')}</h2>
                                <p>{t('workflows.pageDescription')}</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="dashright">
                                <Link to="#" className="btn btn-send" data-bs-toggle="modal" data-bs-target="#myModal3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('workflows.newWorkflowButton')}</Link>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-3">
                            <div className="carddesign cardinfo">
                                <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-workflow h-4 w-4 text-muted-foreground" aria-hidden="true"><rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect></svg></span>
                                <h3>{t('workflows.totalWorkflows')}</h3>
                                <h5>4</h5>
                                <h6 className="activenot">{t('workflows.activeWorkflows', { count: 3 })}</h6>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="carddesign cardinfo">
                                <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap h-4 w-4 text-muted-foreground" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg></span>
                                <h3>{t('workflows.executionsToday')}</h3>
                                <h5>78</h5>
                                <h6>{t('workflows.fromYesterday', { count: 12 })}</h6>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="carddesign cardinfo">
                                <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play h-4 w-4 text-muted-foreground" aria-hidden="true"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path></svg></span>
                                <h3>{t('workflows.successRate')}</h3>
                                <h5>96.5%</h5>
                                <h6>{t('workflows.fromLastWeek', { count: 2.1 })}</h6>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="carddesign cardinfo">
                                <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-workflow h-4 w-4 text-muted-foreground" aria-hidden="true"><rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect></svg></span>
                                <h3>{t('workflows.timeSaved')}</h3>
                                <h5>24h</h5>
                                <h6 className="activenot">{t('workflows.thisWeek')}</h6>
                            </div>
                        </div>
                    </div>
                    <div className="carddesign workflows">
                        <h2 className="card-title">{t('workflows.yourWorkflows')}</h2>
                        <div className="leadlist">
                            <ul className="leadlistul">
                                {loading ? (
                                    <p>{t('loading', 'Loading...')}</p>
                                ) : workflows.length === 0 ? (
                                    <div className="leadlist">
                                        <ul className="leadlistul">
                                            <li>
                                                <p className="text-center">
                                                    {t('workflows.noWorkflows', 'No workflows found')}
                                                </p>
                                            </li>
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="leadlist">
                                        <ul className="leadlistul">
                                            {workflows.map((wf) => (
                                                <li key={wf.id}>
                                                    <div className="leadlist-box">
                                                        <div className="leadlist-info">
                                                            <div className="leadlist-name">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    width="24"
                                                                    height="24"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    className="lucide lucide-workflow"
                                                                >
                                                                    <rect width="8" height="8" x="3" y="3" rx="2" />
                                                                    <path d="M7 11v4a2 2 0 0 0 2 2h4" />
                                                                    <rect width="8" height="8" x="13" y="13" rx="2" />
                                                                </svg>
                                                            </div>
                                                            <h4>
                                                                {wf.name}{' '}
                                                                <div className="badge">
                                                                    {t('workflows.stepsBadge', { count: wf.steps?.length || 0 })}
                                                                </div>
                                                                <div className={`status ${wf.isActive ? 'status3' : 'status4'}`}>
                                                                    {wf.isActive
                                                                        ? t('workflows.statusActive')
                                                                        : t('workflows.statusInactive')}
                                                                </div>
                                                            </h4>
                                                            <h5>{wf.description}</h5>
                                                            <h5>
                                                                <span>
                                                                    {t('workflows.trigger')} {wf.triggerEvent}
                                                                </span>
                                                                {wf.lastRun && (
                                                                    <span>
                                                                        {t('workflows.lastRun')} {wf.lastRun}
                                                                    </span>
                                                                )}
                                                                <span>
                                                                    {t('workflows.executions', { count: wf.executions || 0 })}
                                                                </span>
                                                            </h5>
                                                        </div>
                                                        <div className="leadlist-action">
                                                            <div className="switchbtn">
                                                                <label className="switch">
                                                                    <input type="checkbox" checked={wf.isActive} readOnly />
                                                                    <span className="slider round"></span>
                                                                </label>
                                                            </div>
                                                            <Link to={`/workflows/edit/${wf.id}`} className="action-icon">
                                                                ✏️
                                                            </Link>
                                                            <Link to="#" className="action-icon">⋮</Link>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <li>
                                    <div className="leadlist-box">
                                        <div className="leadlist-info">
                                            <div className="leadlist-name">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-workflow" aria-hidden="true"><rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect></svg>
                                            </div>
                                            <h4>Welcome New Leads <div className="badge">{t('workflows.stepsBadge', { count: 3 })}</div><div className="status status3">{t('workflows.statusActive')}</div></h4>
                                            <h5>Automatically send welcome email to new leads</h5>
                                            <h5><span>{t('workflows.trigger')} New lead created</span><span>{t('workflows.lastRun')} 2025-01-05 14:30</span><span>{t('workflows.executions', { count: 47 })}</span></h5>
                                        </div>
                                        <div className="leadlist-action">
                                            <div className="switchbtn">
                                                <label className="switch">
                                                    <input type="checkbox" defaultChecked />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                            <Link to="#" className="action-icon" data-bs-toggle="modal" data-bs-target="#myModal4"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen w-4 h-4" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></Link>
                                            <Link to="#" className="action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis w-4 h-4" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></Link>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <div className="leadlist-box">
                                        <div className="leadlist-info">
                                            <div className="leadlist-name">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-workflow" aria-hidden="true"><rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect></svg>
                                            </div>
                                            <h4>Follow-up Inactive Leads <div className="badge">{t('workflows.stepsBadge', { count: 2 })}</div><div className="status status3">{t('workflows.statusActive')}</div></h4>
                                            <h5>Send reminder email to leads inactive for 7 days</h5>
                                            <h5><span>{t('workflows.trigger')} Lead inactive</span><span>{t('workflows.lastRun')} 2025-01-05 09:15</span><span>{t('workflows.executions', { count: 23 })}</span></h5>
                                        </div>
                                        <div className="leadlist-action">
                                            <div className="switchbtn">
                                                <label className="switch">
                                                    <input type="checkbox" defaultChecked />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                            <Link to="#" className="action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen w-4 h-4" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></Link>
                                            <Link to="#" className="action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis w-4 h-4" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></Link>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <div className="leadlist-box">
                                        <div className="leadlist-info">
                                            <div className="leadlist-name">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-workflow" aria-hidden="true"><rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect></svg>
                                            </div>
                                            <h4>Assign New Facebook Leads <div className="badge">{t('workflows.stepsBadge', { count: 1 })}</div><div className="status status4">{t('workflows.statusInactive')}</div></h4>
                                            <h5>Automatically assign leads from Facebook to sales team</h5>
                                            <h5><span>{t('workflows.trigger')} Lead from Facebook</span><span>{t('workflows.executions', { count: 0 })}</span></h5>
                                        </div>
                                        <div className="leadlist-action">
                                            <div className="switchbtn">
                                                <label className="switch">
                                                    <input type="checkbox" />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                            <Link to="#" className="action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen w-4 h-4" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></Link>
                                            <Link to="#" className="action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis w-4 h-4" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></Link>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <div className="leadlist-box">
                                        <div className="leadlist-info">
                                            <div className="leadlist-name">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-workflow" aria-hidden="true"><rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect></svg>
                                            </div>
                                            <h4>Notify on Won Lead <div className="badge">{t('workflows.stepsBadge', { count: 2 })}</div><div className="status status3">{t('workflows.statusActive')}</div></h4>
                                            <h5>Send notification when a lead is marked as won</h5>
                                            <h5><span>{t('workflows.trigger')} Lead marked as won</span><span>{t('workflows.lastRun')} 2025-01-04 16:45</span><span>{t('workflows.executions', { count: 8 })}</span></h5>
                                        </div>
                                        <div className="leadlist-action">
                                            <div className="switchbtn">
                                                <label className="switch">
                                                    <input type="checkbox" defaultChecked />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                            <Link to="#" className="action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen w-4 h-4" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></Link>
                                            <Link to="#" className="action-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis w-4 h-4" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></Link>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal fade modaldesign workflowmodal" id="myModal3">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title"><span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg></span>{t('workflows.createWorkflow')}</h4>
                            <p>{t('workflows.createWorkflowDescription')}</p>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
                        </div>
                        <div className="modal-body">
                            <div className="formdesign">
                                <form>
                                    <div className="carddesign">
                                        <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg>{t('workflows.workflowSettings')}</h2>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>{t('workflows.workflowName')}</label>
                                                    <input type="text" className="form-control" id="" placeholder={t('workflows.workflowNamePlaceholder')} />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>{t('workflows.triggerEvent')}</label>
                                                    <div className="inputselect">
                                                        <select className="form-select">
                                                            <option>{t('workflows.selectTrigger')}</option>
                                                            <option>{t('workflows.triggerOptions.newLeadCreated')}</option>
                                                            <option>{t('workflows.triggerOptions.leadCreatedViaFacebook')}</option>
                                                            <option>{t('workflows.triggerOptions.leadCreatedViaWebsite')}</option>
                                                            <option>{t('workflows.triggerOptions.leadCreatedViaAPI')}</option>
                                                            <option>{t('workflows.triggerOptions.leadUpdated')}</option>
                                                            <option>{t('workflows.triggerOptions.leadStatusChanged')}</option>
                                                            <option>{t('workflows.triggerOptions.leadMarkedAsWon')}</option>
                                                            <option>{t('workflows.triggerOptions.leadMarkedAsLost')}</option>
                                                            <option>{t('workflows.triggerOptions.leadInactive')}</option>
                                                        </select>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label>{t('workflows.description')}</label>
                                                    <textarea className="form-control" rows="3" id="comment" name="text" placeholder={t('workflows.descriptionPlaceholder')}></textarea>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="switchbtn">
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked="" />
                                                <span className="slider round"></span>
                                            </label><span className="switchbtntext">{t('workflows.activateWorkflow')}</span><span className="status status5">{t('workflows.statusActive')}</span>
                                        </div>
                                    </div>
                                    <div className="carddesign">
                                        <div className="addstep-heading">
                                            <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('workflows.workflowSteps', { count: 0 })}</h2>
                                            <div className="form-group">
                                                <div className="inputselect">
                                                    <div className="dropdown leaddropdown">
                                                        <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg><span>{t('workflows.addStep')}</span>
                                                        </button>
                                                        <ul className="dropdown-menu" >
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg></div><label>{t('workflows.stepTypes.sendEmail')} <span>{t('workflows.stepTypes.sendEmailDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg></div><label>{t('workflows.stepTypes.sendSms')} <span>{t('workflows.stepTypes.sendSmsDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></div><label>{t('workflows.stepTypes.updateStatus')} <span>{t('workflows.stepTypes.updateStatusDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg></div><label>{t('workflows.stepTypes.assignUser')} <span>{t('workflows.stepTypes.assignUserDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag" aria-hidden="true"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg></div><label>{t('workflows.stepTypes.addTags')} <span>{t('workflows.stepTypes.addTagsDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg></div><label>{t('workflows.stepTypes.waitDelay')} <span>{t('workflows.stepTypes.waitDelayDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg></div><label>{t('workflows.stepTypes.condition')} <span>{t('workflows.stepTypes.conditionDescription')}</span></label></Link></li>
                                                        </ul>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="addstepbox">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus mx-auto" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                            <h4>{t('workflows.noStepsAdded')}</h4>
                                            <p>{t('workflows.addStepInstruction')}</p>
                                            <button className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('workflows.addFirstStep')}</button>
                                        </div>
                                        <div className="carddesign workflowsaddcarddesign">
                                            <div className="workflows-showbox-title">
                                                <div className="workflowsadd-icon">
                                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg></span>
                                                    <div className="badge">1</div>
                                                </div>
                                                <div className="workflowsadd-icondesc">
                                                    <div className="workflowsadd-headingsec">
                                                        <div className="workflowsadd-heading">
                                                            <h4>{t('workflows.stepTypes.sendEmail')} <span className="status">{t('workflows.stepTypes.sendEmail')}</span></h4>
                                                            <div className="workflows-status">{t('workflows.stepTypes.sendEmailDescription')}</div>
                                                        </div>
                                                        <div className="workflowsadd-heading-action">
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                                        </div>
                                                    </div>
                                                    <h2 className="card-title">{t('workflows.emailConfiguration')}</h2>
                                                    <div className="form-group mb-1">
                                                        <label>{t('workflows.emailTemplate')}</label>
                                                        <div className="inputselect">
                                                            <div className="dropdown leaddropdown sendemaidropdown">
                                                                <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                                    <span>{t('workflows.selectEmailTemplate')}</span>
                                                                </button>
                                                                <ul className="dropdown-menu" >
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.emailTemplates.welcomeEmail')} <span>{t('workflows.emailTemplates.welcomeEmailDesc')}</span></Link></li>
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.emailTemplates.followUpEmail')} <span>{t('workflows.emailTemplates.followUpEmailDesc')}</span></Link></li>
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.emailTemplates.offerReady')} <span>{t('workflows.emailTemplates.offerReadyDesc')}</span></Link></li>
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.emailTemplates.meetingReminder')} <span>{t('workflows.emailTemplates.meetingReminderDesc')}</span></Link></li>
                                                                </ul>
                                                            </div>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="carddesign workflowsaddcarddesign">
                                            <div className="workflows-showbox-title">
                                                <div className="workflowsadd-icon">
                                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg></span>
                                                    <div className="badge">2</div>
                                                </div>
                                                <div className="workflowsadd-icondesc">
                                                    <div className="workflowsadd-headingsec">
                                                        <div className="workflowsadd-heading">
                                                            <h4>{t('workflows.stepTypes.sendSms')} <span className="status">{t('workflows.stepTypes.sendSms')}</span></h4>
                                                            <div className="workflows-status">{t('workflows.stepTypes.sendSmsDescription')}</div>
                                                        </div>
                                                        <div className="workflowsadd-heading-action">
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                                        </div>
                                                    </div>
                                                    <h2 className="card-title">{t('workflows.smsConfiguration')}</h2>
                                                    <div className="form-group mb-1">
                                                        <label>{t('workflows.smsTemplate')}</label>
                                                        <div className="inputselect">
                                                            <div className="dropdown leaddropdown sendemaidropdown">
                                                                <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                                    <span>{t('workflows.selectSmsTemplate')}</span>
                                                                </button>
                                                                <ul className="dropdown-menu" >
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.smsTemplates.welcomeSms')} <span>{t('workflows.smsTemplates.welcomeSmsDesc')}</span></Link></li>
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.smsTemplates.followUpSms')} <span>{t('workflows.smsTemplates.followUpSmsDesc')}</span></Link></li>
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.smsTemplates.meetingSms')} <span>{t('workflows.smsTemplates.meetingSmsDesc')}</span></Link></li>
                                                                </ul>
                                                            </div>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="carddesign workflowsaddcarddesign statusupdate">
                                            <div className="workflows-showbox-title">
                                                <div className="workflowsadd-icon">
                                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></span>
                                                    <div className="badge">3</div>
                                                </div>
                                                <div className="workflowsadd-icondesc">
                                                    <div className="workflowsadd-headingsec">
                                                        <div className="workflowsadd-heading">
                                                            <h4>{t('workflows.stepTypes.updateStatus')} <span className="status">{t('workflows.stepTypes.updateStatus')}</span></h4>
                                                            <div className="workflows-status">{t('workflows.stepTypes.updateStatusDescription')}</div>
                                                        </div>
                                                        <div className="workflowsadd-heading-action">
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                                        </div>
                                                    </div>
                                                    <h2 className="card-title">{t('workflows.statusUpdate')}</h2>
                                                    <div className="form-group mb-1">
                                                        <label>{t('workflows.newStatus')}</label>
                                                        <div className="inputselect">
                                                            <div className="dropdown leaddropdown sendemaidropdown">
                                                                <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                                    <span>{t('workflows.selectNewStatus')}</span>
                                                                </button>
                                                                <ul className="dropdown-menu">
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.statusOptions.new')}</Link></li>
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.statusOptions.contacted')}</Link></li>
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.statusOptions.qualified')}</Link></li>
                                                                    <li><Link className="dropdown-item" to="#"><div className="dot purpledot"></div>{t('workflows.statusOptions.offerSent')}</Link></li>
                                                                    <li><Link className="dropdown-item" to="#"><div className="dot greendot"></div>{t('workflows.statusOptions.won')}</Link></li>
                                                                    <li><Link className="dropdown-item" to="#"><div className="dot reddot"></div>{t('workflows.statusOptions.lost')}</Link></li>
                                                                </ul>
                                                            </div>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="carddesign workflowsaddcarddesign assignuser">
                                            <div className="workflows-showbox-title">
                                                <div className="workflowsadd-icon">
                                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg></span>
                                                    <div className="badge">4</div>
                                                </div>
                                                <div className="workflowsadd-icondesc">
                                                    <div className="workflowsadd-headingsec">
                                                        <div className="workflowsadd-heading">
                                                            <h4>{t('workflows.stepTypes.assignUser')} <span className="status">{t('workflows.stepTypes.assignUser')}</span></h4>
                                                            <div className="workflows-status">{t('workflows.stepTypes.assignUserDescription')}</div>
                                                        </div>
                                                        <div className="workflowsadd-heading-action">
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                                        </div>
                                                    </div>
                                                    <h2 className="card-title">{t('workflows.userAssignment')}</h2>
                                                    <div className="form-group mb-1">
                                                        <label>{t('workflows.assignTo')}</label>
                                                        <div className="inputselect">
                                                            <div className="dropdown leaddropdown sendemaidropdown">
                                                                <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                                    <span>{t('workflows.selectUser')}</span>
                                                                </button>
                                                                <ul className="dropdown-menu" >
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.userOptions.larsHansen')} <span>lars@firma.dk</span></Link></li>
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.userOptions.annaNielsen')} <span>anna@firma.dk</span></Link></li>
                                                                    <li><Link className="dropdown-item" to="#">{t('workflows.userOptions.martinAndersen')} <span>martin@firma.dk</span></Link></li>
                                                                </ul>
                                                            </div>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="carddesign workflowsaddcarddesign assignuser">
                                            <div className="workflows-showbox-title">
                                                <div className="workflowsadd-icon">
                                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag" aria-hidden="true"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg></span>
                                                    <div className="badge">5</div>
                                                </div>
                                                <div className="workflowsadd-icondesc">
                                                    <div className="workflowsadd-headingsec">
                                                        <div className="workflowsadd-heading">
                                                            <h4>{t('workflows.stepTypes.addTags')} <span className="status">{t('workflows.stepTypes.addTags')}</span></h4>
                                                            <div className="workflows-status">{t('workflows.stepTypes.addTagsDescription')}</div>
                                                        </div>
                                                        <div className="workflowsadd-heading-action">
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                                        </div>
                                                    </div>
                                                    <h2 className="card-title">{t('workflows.tagConfiguration')}</h2>
                                                    <div className="form-group mb-1">
                                                        <label>{t('workflows.tagsPlaceholder')}</label>
                                                        <input type="text" className="form-control" id="" placeholder="hot-lead, urgent, vip" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="carddesign workflowsaddcarddesign waitdelay">
                                            <div className="workflows-showbox-title">
                                                <div className="workflowsadd-icon">
                                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg></span>
                                                    <div className="badge">6</div>
                                                </div>
                                                <div className="workflowsadd-icondesc">
                                                    <div className="workflowsadd-headingsec">
                                                        <div className="workflowsadd-heading">
                                                            <h4>{t('workflows.stepTypes.waitDelay')} <span className="status">{t('workflows.stepTypes.waitDelay')}</span></h4>
                                                            <div className="workflows-status">{t('workflows.stepTypes.waitDelayDescription')}</div>
                                                        </div>
                                                        <div className="workflowsadd-heading-action">
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                                        </div>
                                                    </div>
                                                    <h2 className="card-title">{t('workflows.waitDelayConfiguration')}</h2>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="form-group mb-1">
                                                                <label>{t('workflows.duration')}</label>
                                                                <input type="number" className="form-control" id="" placeholder="5" />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="form-group mb-1">
                                                                <label>{t('workflows.unit')}</label>
                                                                <div className="inputselect">
                                                                    <select className="form-select">
                                                                        <option>{t('workflows.unitOptions.minutes')}</option>
                                                                        <option>{t('workflows.unitOptions.hours')}</option>
                                                                        <option>{t('workflows.unitOptions.days')}</option>
                                                                    </select>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="carddesign workflowsaddcarddesign condition">
                                            <div className="workflows-showbox-title">
                                                <div className="workflowsadd-icon">
                                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg></span>
                                                    <div className="badge">7</div>
                                                </div>
                                                <div className="workflowsadd-icondesc">
                                                    <div className="workflowsadd-headingsec">
                                                        <div className="workflowsadd-heading">
                                                            <h4>{t('workflows.stepTypes.condition')} <span className="status">{t('workflows.stepTypes.condition')}</span></h4>
                                                            <div className="workflows-status">{t('workflows.stepTypes.conditionDescription')}</div>
                                                        </div>
                                                        <div className="workflowsadd-heading-action">
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                                        </div>
                                                    </div>
                                                    <h2 className="card-title">{t('workflows.conditionConfiguration')}</h2>
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <div className="form-group mb-1">
                                                                <label>{t('workflows.field')}</label>
                                                                <div className="inputselect">
                                                                    <select className="form-select">
                                                                        <option>{t('workflows.selectField')}</option>
                                                                        <option>{t('workflows.fieldOptions.status')}</option>
                                                                        <option>{t('workflows.fieldOptions.leadValue')}</option>
                                                                        <option>{t('workflows.fieldOptions.source')}</option>
                                                                        <option>{t('workflows.fieldOptions.email')}</option>
                                                                        <option>{t('workflows.fieldOptions.phone')}</option>
                                                                        <option>{t('workflows.fieldOptions.company')}</option>
                                                                        <option>{t('workflows.fieldOptions.tags')}</option>
                                                                    </select>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="form-group mb-1">
                                                                <label>{t('workflows.operator')}</label>
                                                                <div className="inputselect">
                                                                    <select className="form-select">
                                                                        <option>{t('workflows.selectOperator')}</option>
                                                                        <option>{t('workflows.operatorOptions.equals')}</option>
                                                                        <option>{t('workflows.operatorOptions.notEquals')}</option>
                                                                        <option>{t('workflows.operatorOptions.contains')}</option>
                                                                        <option>{t('workflows.operatorOptions.greaterThan')}</option>
                                                                        <option>{t('workflows.operatorOptions.lessThan')}</option>
                                                                    </select>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="form-group mb-1">
                                                                <label>{t('workflows.value')}</label>
                                                                <input type="text" className="form-control" id="" placeholder={t('workflows.enterValuePlaceholder')} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <h2 className="card-title conditioncard-title2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>{t('workflows.ifThenElse')}</h2>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="carddesign cardhandling1">
                                                                <h4><span></span>{t('workflows.ifTrue')}</h4>
                                                                <div className="form-group mb-1">
                                                                    <label>{t('workflows.action')}</label>
                                                                    <div className="inputselect">
                                                                        <select className="form-select">
                                                                            <option>{t('workflows.actionOptions.continueNextStep')}</option>
                                                                            <option>{t('workflows.actionOptions.endWorkflow')}</option>
                                                                            <option>{t('workflows.actionOptions.jumpToStep')}</option>
                                                                        </select>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="carddesign cardhandling2">
                                                                <h4><span></span>{t('workflows.ifFalse')}</h4>
                                                                <div className="form-group mb-1">
                                                                    <label>{t('workflows.action')}</label>
                                                                    <div className="inputselect">
                                                                        <select className="form-select">
                                                                            <option>{t('workflows.actionOptions.continueNextStep')}</option>
                                                                            <option>{t('workflows.actionOptions.endWorkflow')}</option>
                                                                            <option>{t('workflows.actionOptions.jumpToStep')}</option>
                                                                        </select>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modalfooter btn-right opretworkflow">
                                        <div className="opretworkflowleft">{t('workflows.stepsConfigured', { count: 7 })}</div>
                                        <div className="opretworkflow-right">
                                            <Link to="#" className="btn btn-add">{t('workflows.cancel')}</Link>
                                            <Link to="#" className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>{t('workflows.saveWorkflow')}</Link>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal fade modaldesign workflowmodal" id="myModal4">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title"><span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg></span>{t('workflows.editWorkflow')}</h4>
                            <p>{t('workflows.editWorkflowDescription')}</p>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
                        </div>
                        <div className="modal-body">
                            <div className="formdesign">
                                <form>
                                    <div className="carddesign">
                                        <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg>{t('workflows.workflowSettings')}</h2>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>{t('workflows.workflowName')}</label>
                                                    <input type="text" className="form-control" id="" placeholder="Welcome New Leads" />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>{t('workflows.triggerEvent')}</label>
                                                    <div className="inputselect">
                                                        <select className="form-select">
                                                            <option>{t('workflows.triggerOptions.newLeadCreated')}</option>
                                                            <option>{t('workflows.triggerOptions.leadCreatedViaFacebook')}</option>
                                                            <option>{t('workflows.triggerOptions.leadCreatedViaWebsite')}</option>
                                                            <option>{t('workflows.triggerOptions.leadCreatedViaAPI')}</option>
                                                            <option>{t('workflows.triggerOptions.leadUpdated')}</option>
                                                            <option>{t('workflows.triggerOptions.leadStatusChanged')}</option>
                                                            <option>{t('workflows.triggerOptions.leadMarkedAsWon')}</option>
                                                            <option>{t('workflows.triggerOptions.leadMarkedAsLost')}</option>
                                                            <option>{t('workflows.triggerOptions.leadInactive')}</option>
                                                        </select>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label>{t('workflows.description')}</label>
                                                    <textarea className="form-control" rows="3" id="comment" name="text" placeholder="Automatically send welcome email to new leads"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="switchbtn">
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked="" />
                                                <span className="slider round"></span>
                                            </label><span className="switchbtntext">{t('workflows.activateWorkflow')}</span><span className="status status5">{t('workflows.statusActive')}</span>
                                        </div>
                                        <div className="alertbox">
                                            <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>{t('workflows.alertTriggerEvent')}</h2>
                                            <p>{t('workflows.alertTriggerMessage')}<strong>{t('workflows.triggerOptions.newLeadCreated')}</strong></p>
                                        </div>
                                    </div>
                                    <div className="carddesign">
                                        <div className="addstep-heading">
                                            <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('workflows.workflowSteps', { count: 1 })}</h2>
                                            <div className="form-group">
                                                <div className="inputselect">
                                                    <div className="dropdown leaddropdown">
                                                        <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg><span>{t('workflows.addStep')}</span>
                                                        </button>
                                                        <ul className="dropdown-menu" >
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg></div><label>{t('workflows.stepTypes.sendEmail')} <span>{t('workflows.stepTypes.sendEmailDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg></div><label>{t('workflows.stepTypes.sendSms')} <span>{t('workflows.stepTypes.sendSmsDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></div><label>{t('workflows.stepTypes.updateStatus')} <span>{t('workflows.stepTypes.updateStatusDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg></div><label>{t('workflows.stepTypes.assignUser')} <span>{t('workflows.stepTypes.assignUserDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag" aria-hidden="true"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg></div><label>{t('workflows.stepTypes.addTags')} <span>{t('workflows.stepTypes.addTagsDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg></div><label>{t('workflows.stepTypes.waitDelay')} <span>{t('workflows.stepTypes.waitDelayDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#"><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg></div><label>{t('workflows.stepTypes.condition')} <span>{t('workflows.stepTypes.conditionDescription')}</span></label></Link></li>
                                                        </ul>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="carddesign workflowsaddcarddesign">
                                            <div className="workflows-showbox-title">
                                                <div className="workflowsadd-icon">
                                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg></span>
                                                    <div className="badge">2</div>
                                                </div>
                                                <div className="workflowsadd-icondesc">
                                                    <div className="workflowsadd-headingsec">
                                                        <div className="workflowsadd-heading">
                                                            <h4>{t('workflows.triggerOptions.newLeadCreated')} <span className="status">Unknown</span></h4>
                                                            <div className="workflows-status">When a new lead is added to the system</div>
                                                        </div>
                                                        <div className="workflowsadd-heading-action">
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                                            <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modalfooter btn-right opretworkflow">
                                        <div className="opretworkflowleft">{t('workflows.stepsConfigured', { count: 1 })}</div>
                                        <div className="opretworkflow-right">
                                            <Link to="#" className="btn btn-add">{t('workflows.cancel')}</Link>
                                            <Link to="#" className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>{t('workflows.saveWorkflow')}</Link>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default WorkflowsPage;