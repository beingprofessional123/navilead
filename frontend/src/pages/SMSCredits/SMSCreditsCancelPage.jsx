import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const SMSCreditsCancelPage = () => {
  const [countdown, setCountdown] = useState(5); // 5 seconds countdown

  useEffect(() => {
    toast.info('Payment process was cancelled.');

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Redirect and reload page
          window.location.href = '/sms-credits';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
        {/* ❌ Cancelled SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100px', height: '100px' }}
          className="text-red-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>

        <h2 className="text-xl font-semibold text-red-600 mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 text-sm mb-2">
          The Payment process was cancelled.
        </p>
        <p className="text-gray-500 text-sm">
          Redirecting to billing page in {countdown} second{countdown > 1 ? 's' : ''}...
        </p>
      </div>
    </div>
  );
};

export default SMSCreditsCancelPage;
