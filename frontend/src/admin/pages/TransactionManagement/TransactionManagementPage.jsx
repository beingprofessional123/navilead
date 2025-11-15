import React, { useEffect, useState, useContext } from 'react';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import MobileHeader from '../../components/MobileHeader';
import { useTranslation } from "react-i18next";
import MUIDataTable from "mui-datatables";

const TransactionManagementPage = () => {
  const { authToken } = useContext(AdminAuthContext);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  // 'all', 'subscription', or 'sms' (API uses 'credit', but 'sms' is clearer for frontend filtering)
  const [transactionType, setTransactionType] = useState('all'); 
  const { t } = useTranslation();

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/admin/transaction-management', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const notApplicable = t('admin.transactionManagement.table.notApplicable');

      // Transform data to add easy display fields and handle API type differences
      const formatted = res.data.transactions.map((txn) => {
        
        // 1. Determine the filtering type based on planId or smsPlanId presence
        let type;
        if (txn.planId || txn.type === 'subscription') {
            type = 'subscription';
        } else if (txn.smsPlanId || txn.type === 'credit') {
            type = 'sms';
        } else {
            type = 'other'; // Fallback type
        }
        
        return {
            id: txn.id,
            userName: txn.user?.name || notApplicable,
            userEmail: txn.user?.email || notApplicable,
            planName: txn.plan?.name || txn.smsPlan?.name || notApplicable,
            
            // Internal type used for filtering
            type: type, 
            
            // Display name for the plan type
            planTypeDisplay: type === "subscription" 
                ? t('admin.transactionManagement.table.typeSubscription') 
                : type === "sms" 
                ? t('admin.transactionManagement.table.typeSMS')
                : notApplicable,
                
            price: txn.amount ? `DKK ${txn.amount}` : notApplicable,
            billing: txn.plan?.billing_type || notApplicable,
            status: txn.status,
            date: new Date(txn.createdAt).toLocaleString(),
            invoiceUrl: txn.invoiceUrl,
            invoiceNo: txn.invoiceNo,
        };
      });

      setAllTransactions(formatted);
    } catch (err) {
      console.error(err);
      toast.error(t('admin.transactionManagement.alerts.fetchFail'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) fetchTransactions();
  }, [authToken]);

  // Filter transactions based on the active tab
  const transactionsToDisplay = allTransactions.filter(txn => {
    if (transactionType === 'all') return true;
    return txn.type === transactionType;
  });

  if (loading) return <div>{t('admin.transactionManagement.loading')}</div>;

  // Define columns
  const columns = [
    {
      name: 'invoiceNo',
      label: t('admin.transactionManagement.table.invoiceNo'),
      options: { filter: false, sort: true },
    },
    {
      name: 'planName',
      label: t('admin.transactionManagement.table.planName'),
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          // Use transactionsToDisplay for current row data
          const txn = transactionsToDisplay[tableMeta.rowIndex]; 
          return (
            <span className="leadlink">
              {value}
              <small className="d-block text-muted">
                {txn.planTypeDisplay}
              </small>
            </span>
          );
        },
      },
    },
    {
      name: 'userName',
      label: t('admin.transactionManagement.table.user'),
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta) => {
          // Use transactionsToDisplay for current row data
          const txn = transactionsToDisplay[tableMeta.rowIndex];
          return (
            <div>
              <strong>{value}</strong>
              <div className="text-muted" style={{ fontSize: "0.85em" }}>
                {txn.userEmail}
              </div>
            </div>
          );
        },
      },
    },
    {
      name: 'price',
      label: t('admin.transactionManagement.table.amount'),
      options: { filter: false, sort: true },
    },
    {
      name: 'billing',
      label: t('admin.transactionManagement.table.billingType'),
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
            const notApplicable = t('admin.transactionManagement.table.notApplicable');
            // Check the internal type instead of just checking for '-'
            const txn = transactionsToDisplay[tableMeta.rowIndex];
            
            if (txn.type === 'sms' && value === notApplicable) {
                return 'Credit'; // Display 'Credit' for SMS transactions without a billing type
            }
            
            // Otherwise, return the original value (e.g., 'monthly', 'yearly', or the dash)
            return value;
        },
      },
    },
    {
      name: 'status',
      label: t('admin.transactionManagement.table.status'),
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => (
          // Use status name for color coding
          <span className={`text-${value === 'paid' || value === 'succeeded' ? 'success' : 'danger'}`}>
            <b>{value.toUpperCase()}</b>
          </span>
        ),
      },
    },
    {
      name: 'date',
      label: t('admin.transactionManagement.table.date'),
      options: { filter: false, sort: true },
    },
    {
      name: 'invoiceUrl',
      label: t('admin.transactionManagement.table.invoice'),
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value) =>
          value && value !== t('admin.transactionManagement.table.notApplicable') ? (
            <a href={value} style={{ color: '#00d4f0' }} target="_blank" rel="noopener noreferrer">
              <b>{t('admin.transactionManagement.table.viewLink')}</b>
            </a>
          ) : (
            t('admin.transactionManagement.table.notApplicable')
          ),
      },
    },
  ];
  
  return (
   <>
    <style>{`
      .nav-tabs .nav-item.show .nav-link, 
      .nav-tabs .nav-link.active {
        color: #0f1418 !important;
        background-color: #02d4f0 !important;
        border-color: #02d4f0 !important;
      }
      .nav-tabs .nav-link:focus, 
      .nav-tabs .nav-link:hover {
        isolation: isolate;
        border-color: #02d4f0 !important;
        color: #0f1418 !important;
        background-color: #02d4f0 !important;
      }
      .nav-tabs {
        border-bottom: var(--bs-nav-tabs-border-width) solid #02d4f0 !important;
      }
      .nav-link {
        color: #cff !important;
      }
    `}</style>
    <div className="mainbody">
      <div className="container-fluid">
        <MobileHeader />
        <div className="row top-row">
          <div className="col-md-12">
            <div className="dash-heading">
              <h2>{t('admin.transactionManagement.title')}</h2>
              <p>{t('admin.transactionManagement.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="carddesign leadstable">
              {/* Tab Navigation */}
              <ul className="nav nav-tabs">
                <li className="nav-item">
                  <a
                    className={`nav-link ${transactionType === 'all' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => { e.preventDefault(); setTransactionType('all'); }}
                  >
                    {t('admin.transactionManagement.tabs.all')}
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className={`nav-link ${transactionType === 'subscription' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => { e.preventDefault(); setTransactionType('subscription'); }}
                  >
                    {t('admin.transactionManagement.tabs.subscriptions')}
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className={`nav-link ${transactionType === 'sms' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => { e.preventDefault(); setTransactionType('sms'); }}
                  >
                    {t('admin.transactionManagement.tabs.sms')}
                  </a>
                </li>
              </ul>
              
              <div className="admin_tabledesign">
                <MUIDataTable
                  // Use transactionsToDisplay.length for accurate count based on the active tab
                  title={t('admin.transactionManagement.table.title', { count: transactionsToDisplay.length })} 
                  data={transactionsToDisplay}
                  columns={columns}
                  options={{
                    selectableRows: 'none',
                    elevation: 2,
                    filter: true,
                    responsive: 'standard',
                    download: true,
                    print: false,
                    viewColumns: true,
                    pagination: true,
                    rowsPerPage: 10,
                    rowsPerPageOptions: [10, 25, 50],
                    textLabels: {
                      body: { noMatch: t('admin.transactionManagement.table.noMatch') },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default TransactionManagementPage;