import React, { useEffect, useState, useContext } from 'react';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import MobileHeader from '../../components/MobileHeader';
import { useTranslation } from "react-i18next";
import MUIDataTable from "mui-datatables";

const TransactionManagementPage = () => {
  const { authToken } = useContext(AdminAuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/admin/transaction-management', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      // Transform data to add easy display fields
      const formatted = res.data.transactions.map((txn) => ({
        id: txn.id,
        userName: txn.user?.name || "—",
        userEmail: txn.user?.email || "—",
        planName: txn.plan?.name || txn.smsPlan?.name || "—",
        planType: txn.type === "subscription" ? "Subscription" : "SMS Credit",
        price: txn.amount ? `DKK ${txn.amount}` : "—",
        billing: txn.plan?.billing_type || "—",
        status: txn.status,
        date: new Date(txn.createdAt).toLocaleString(),
        invoiceUrl: txn.invoiceUrl,
        invoiceNo: txn.invoiceNo,
      }));

      setTransactions(formatted);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) fetchTransactions();
  }, [authToken]);

  if (loading) return <div>Loading...</div>;

  // Define columns
  const columns = [
    {
      name: 'invoiceNo',
      label: 'Invoice No.',
      options: { filter: false, sort: true },
    },
    {
      name: 'planName',
      label: 'Plan Name',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const txn = transactions[tableMeta.rowIndex];
          return (
            <span className="leadlink">
              {value}
              <small className="d-block text-muted">
                {txn.planType}
              </small>
            </span>
          );
        },
      },
    },
    {
      name: 'userName',
      label: 'User',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const txn = transactions[tableMeta.rowIndex];
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
      label: 'Amount',
      options: { filter: false, sort: true },
    },
    {
      name: 'billing',
      label: 'Billing Type',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => value !== "—" ? value : "—",
      },
    },
    {
      name: 'status',
      label: 'Status',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => (
          <span className={`badge ${value === 'paid' || value === 'succeeded' ? 'badge4' : 'badge1'}`}>
            {value.toUpperCase()}
          </span>
        ),
      },
    },
    {
      name: 'date',
      label: 'Date',
      options: { filter: false, sort: true },
    },
    {
      name: 'invoiceUrl',
      label: 'Invoice',
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value) =>
          value ? (
            <a href={value} target="_blank" rel="noopener noreferrer">
              View
            </a>
          ) : (
            "—"
          ),
      },
    },
  ];

  return (
    <div className="mainbody">
      <div className="container-fluid">
        <MobileHeader />
        <div className="row top-row">
          <div className="col-md-6">
            <div className="dash-heading">
              <h2>Transaction Management</h2>
              <p>List and view of all transactions.</p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="carddesign leadstable">
              <div className="admin_tabledesign">
                <MUIDataTable
                  title={`All Transactions (${transactions.length})`}
                  data={transactions}
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
                      body: { noMatch: "No transactions found" },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManagementPage;
