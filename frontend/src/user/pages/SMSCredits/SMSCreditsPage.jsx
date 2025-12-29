import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";
import { AuthContext } from '../../context/AuthContext';
import api from '../../../utils/api';
// Assuming MobileHeader is still used for the mobile view's logic, 
// even if the HTML structure is slightly different.
import MobileHeader from '../../components/common/MobileHeader';

const SMSCreditsPage = () => {
    const { authToken } = useContext(AuthContext);
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [smsCurrentBalance, setCurrentBalance] = useState(0);
    const [smsCreditsPlan, setsmsCreditsPlan] = useState([]);
    const [transactionHistoy, setTransactionHistoy] = useState([]);

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                setLoading(true);

                // Set headers with auth token
                const config = {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                };

                const responseplanList = await api.get('/smsCredits/planList', config);
                const responsetransetTransactionHistoy = await api.get('/smsCredits/transactionHistoy', config);
                const responseCurrentBalance = await api.get('/smsCredits/CurrentBalance', config);

                setsmsCreditsPlan(responseplanList.data || []);
                setTransactionHistoy(responsetransetTransactionHistoy.data || []);
                setCurrentBalance(responseCurrentBalance.data.currentBalance || 0);
            } catch (error) {
                toast.error('Failed to fetch SMS credits');
            } finally {
                setLoading(false);
            }
        };

        if (authToken) fetchCredits();
    }, [authToken]);

    const handleBuyNow = async (planId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const response = await api.post('/smsCredits/create-checkout-session', { planId }, config);

            window.location.href = response.data.checkoutUrl;
        } catch (error) {
            toast.error('Failed to initiate payment');
            console.error(error);
        }
    };

    // If loading, you might want to show a spinner or a blank page
    if (loading) {
        return <div className="mainbody"><div className="container-fluid">Loading SMS Credits...</div></div>;
    }


    return (
        <div className="mainbody">
            <div className="container-fluid">

                {/* MOBILE HEADER - REFLECTS THE NEW HTML STRUCTURE 
                  NOTE: The original React component used the <MobileHeader /> component. 
                  This is replacing it with the new static HTML for the mobile header structure.
                */}
                <MobileHeader />

                {/* HEADER ROW - DYNAMIC CONTENT INTEGRATED */}
                <div className="row top-row">
                    <div className="col-md-6">
                        <div className="dash-heading">
                            <h2>SMS Credits</h2>
                            <p>Manage your SMS balance and buy more credits according to your plan.</p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="dashright">
                            {/* DYNAMIC CURRENT BALANCE */}
                            <a href="#" className="btn btn-send">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                {smsCurrentBalance} SMS Current Balance
                            </a>
                        </div>
                    </div>
                </div>

                {/* SMS PLANS - DYNAMIC MAPPING INTEGRATED */}
                <div className="row">
                    {smsCreditsPlan.map((plan) => (
                        <div className="col-md-3" key={plan.id}>
                            <div className="carddesign cardinfo sms-creditscard">
                                {/* Using plan data for title and description */}
                                <h3>{plan.name} <span>{plan.description}</span></h3>
                                <div className="smsprices">
                                    <div className="sms-creditscard-left">
                                        {/* Using plan data for price and currency */}
                                        <h4>{plan.price} {t('currency.dkk')}</h4>
                                        <p>Price</p>
                                    </div>
                                    <div className="sms-creditscard-left">
                                        {/* Using plan data for SMS count */}
                                        <h4>{plan.smsCount}</h4>
                                        <p>SMS</p>
                                    </div>
                                </div>
                                {/* Dynamic Buy Now button */}
                                <button
                                    className="btn btn-add w-100"
                                    onClick={() => handleBuyNow(plan.id)}
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* INVOICE HISTORY - DYNAMIC MAPPING INTEGRATED */}
                <div className="carddesign invoicehistory">
                    <div className="planactive-heading">
                        <div>
                            <h2 className="card-title">{t('invoiceHistory.title')}</h2>
                            <p>{t('invoiceHistory.subtitle')}</p>
                        </div>
                    </div>
                    <div className="tabledesign">
                        <div className="table-responsive" style={{ minHeight: "150px", maxHeight: "430px" }}>
                            <table className="table">
                                <thead style={{ position: "sticky", top: 0, background: "rgb(22 31 38)", zIndex: 10, }}>
                                    <tr>
                                        <th style={{ minWidth: '40px' }}>#</th>
                                        <th style={{ minWidth: '120px' }}>{t('invoiceHistory.table.date')}</th>
                                        <th>{t('invoiceHistory.table.plan')}</th>
                                        <th>{t('invoiceHistory.table.amount')}</th>
                                        <th>{t('invoiceHistory.table.status')}</th>
                                        <th>{t('invoiceHistory.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionHistoy.length > 0 ? (
                                        transactionHistoy.map((invoice, index) => (
                                            <tr key={index}>
                                                <td><strong>{index + 1}</strong></td>
                                                <td>
                                                    {new Date(invoice.createdAt).toLocaleString('en-US', {
                                                        weekday: 'short', day: '2-digit', month: 'short',
                                                        hour: 'numeric', minute: '2-digit', hour12: true
                                                    })}
                                                </td>
                                                <td>{invoice?.smsPlan?.name || 'N/A'}</td>
                                                <td>{invoice.amount} {t('currency.dkk')}</td>
                                                <td>
                                                    {/* The status class might need to be adjusted based on the CSS */}
                                                    <div className="status status6">
                                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <a href={invoice.invoiceUrl} className="btn btn-add downloadbtn">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download m-0" aria-hidden="true"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>
                                                    </a>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                                {'No transactions found.'}
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
    );
};

export default SMSCreditsPage;