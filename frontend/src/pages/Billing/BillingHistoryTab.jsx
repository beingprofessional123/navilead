import React, { useMemo } from 'react';
import { useTranslation } from "react-i18next";

const BillingHistoryTab = ({ transactions }) => {
  const { t } = useTranslation();

  // Compute payment metrics
  const metrics = useMemo(() => {
    const totalPaid = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

    const currentYear = new Date().getFullYear();
    const invoicesThisYear = transactions.filter(tx => new Date(tx.createdAt).getFullYear() === currentYear).length;

    const onTimeCount = transactions.filter(tx => tx.status.toLowerCase() === 'paid').length;
    const onTimeRate = transactions.length ? Math.round((onTimeCount / transactions.length) * 100) : 0;

    return { totalPaid, invoicesThisYear, onTimeRate };
  }, [transactions]);

  return (
    <div id="menu4" className="tab-pane fade">
      <div className="carddesign invoicehistory">
        <div className="planactive-heading">
          <div>
            <h2 className="card-title">{t('invoiceHistory.title')}</h2>
            <p>{t('invoiceHistory.subtitle')}</p>
          </div>
        </div>

        {/* Invoice Table - Dynamic */}
        <div className="tabledesign">
          <div className="table-responsive" style={{ minHeight: "250px", maxHeight: "430px" }}>
            <table className="table">
              <thead style={{ position: "sticky", top: 0, background: "rgb(22 31 38)", zIndex: 10, }}>
                <tr>
                  <th style={{ minWidth: '120px' }}>{t('invoiceHistory.table.invoiceNumber')}</th>
                  <th>{t('invoiceHistory.table.date')}</th>
                  <th>{t('invoiceHistory.table.plan')}</th>
                  <th>{t('invoiceHistory.table.amount')}</th>
                  <th>{t('invoiceHistory.table.status')}</th>
                  <th>{t('invoiceHistory.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((invoice, index) => (
                  <tr key={index}>
                    <td><strong>{invoice.invoiceNo}</strong></td>
                    <td>
                      {new Date(invoice.createdAt).toLocaleString('en-US', {
                        weekday: 'short',   // Mon
                        day: '2-digit',     // 29
                        month: 'short',     // Sep
                        hour: 'numeric',    // 4
                        minute: '2-digit',  // 17
                        hour12: true        // PM
                      })}
                    </td>

                    <td>{invoice?.plan?.name}</td>
                    <td>{invoice.amount} {t('currency.dkk')}</td>
                    <td>
                      <div className="status status6">
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </div>
                    </td>

                    <td><a href={invoice.invoiceUrl} className="btn btn-add downloadbtn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download m-0" aria-hidden="true"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Payment Metrics - Dynamic */}
      <div className="carddesign smsprices">
        <h2 className="card-title">{t('paymentMetrics.title')}</h2>
        <div className="row">
          <div className="col-md-4">
            <h4>{metrics.totalPaid.toFixed(2)} {t('currency.dkk')}</h4>
            <p>{t('paymentMetrics.totalPaid')}</p>
          </div>
          <div className="col-md-4">
            <h4>{metrics.invoicesThisYear}</h4>
            <p>{t('paymentMetrics.invoicesThisYear')}</p>
          </div>
          <div className="col-md-4">
            <h4><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-green-500" aria-hidden="true"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg>{metrics.onTimeRate}%</h4>
            <p>{t('paymentMetrics.onTimePaid')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingHistoryTab;
