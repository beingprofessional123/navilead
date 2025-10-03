import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import FullPageLoader from '../../components/common/FullPageLoader';

const SubscriptionSuccessPage = () => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [userPlanData, setUserPlanData] = useState(null);
  const [apiMessage, setApiMessage] = useState('');
  const [countdown, setCountdown] = useState(5); // 5 seconds countdown
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { authToken, userPlan, setUserPlan } = useContext(AuthContext);
  const oldSubscriptionId = userPlan?.subscriptionId || null;


  useEffect(() => {
    const verifySession = async () => {
      try {
        setErrorMsg(null);
        setLoading(true);

        const response = await api.post(
          '/subscriptions/verify-session',
          { sessionId,oldSubscriptionId },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        setApiMessage(response.data.message || 'Subscription verified successfully!');

        if (response.data.userPlan) {
          if (setUserPlan) setUserPlan(response.data.userPlan);
          localStorage.setItem('userPlan', JSON.stringify(response.data.userPlan));
          setUserPlanData(response.data.userPlan);
        }

        toast.success(response.data.message || 'Subscription verified successfully!');
      } catch (error) {
        console.error(error);
        const msg =
          error.response?.data?.message || 'Subscription verification failed. Please try again.';
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) verifySession();
  }, [sessionId, authToken, setUserPlan,oldSubscriptionId]);

  // Countdown effect for redirect
  useEffect(() => {
    if (!loading && !errorMsg) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Redirect and reload page
            window.location.href = '/billing';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading, errorMsg]);


  if (loading) return <FullPageLoader />;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-8 text-center max-w-md w-full">
        {errorMsg ? (
          <>
            {/* ❌ Error SVG */}
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
            <h2 className="text-xl font-semibold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-600 text-sm">{errorMsg}</p>
          </>
        ) : (
          <>
            {/* ✅ Verified SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100px', height: '100px' }}
              className="text-green-500 mx-auto mb-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 
                   9.75s4.365 9.75 9.75 9.75 9.75-4.365 
                   9.75-9.75S17.385 2.25 12 2.25zm4.28 
                   7.72a.75.75 0 10-1.06-1.06l-4.72 
                   4.72-2.22-2.22a.75.75 0 10-1.06 
                   1.06l2.75 2.75a.75.75 0 001.06 
                   0l5.25-5.25z"
                clipRule="evenodd"
              />
            </svg>
            {/* Dynamic message from API */}
            <h2 className="text-xl font-semibold text-green-600 mb-2">{apiMessage}</h2>

            <div className="text-left bg-gray-50 p-4 rounded-md text-sm mb-4">
              <p>
                <strong>Status:</strong> {userPlanData?.status}
              </p>
              <p>
                <strong>Plan Name:</strong> {userPlanData?.plan?.name}
              </p>
            </div>

            <p className="text-gray-500 text-sm">
              Redirecting to billing page in {countdown} second{countdown > 1 ? 's' : ''}...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;
