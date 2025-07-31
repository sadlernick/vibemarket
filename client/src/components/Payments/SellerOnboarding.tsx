import React, { useState, useEffect } from 'react';
import { BanknotesIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface SellerOnboardingProps {
  onComplete?: () => void;
}

const SellerOnboarding: React.FC<SellerOnboardingProps> = ({ onComplete }) => {
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const response = await axios.get('/payments/connect-account-status');
      setAccountStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check account status');
    } finally {
      setLoading(false);
    }
  };

  const createConnectAccount = async () => {
    setCreating(true);
    setError(null);

    try {
      const response = await axios.post('/payments/create-connect-account');
      
      // Redirect to Stripe onboarding
      window.location.href = response.data.onboardingUrl;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create Stripe account');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (accountStatus?.hasAccount && accountStatus?.detailsSubmitted && accountStatus?.chargesEnabled) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Setup Complete!
          </h3>
          <p className="text-gray-600 mb-6">
            You're all set to receive payments from project sales. Earnings will be automatically transferred to your account.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-800">Charges Enabled:</span>
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-green-800">Payouts Enabled:</span>
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <BanknotesIcon className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Set Up Payments to Sell Projects
        </h3>
        <p className="text-gray-600 mb-6">
          Connect your bank account to receive payments from buyers. We use Stripe to securely process payments and handle payouts.
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 className="font-medium text-gray-900 mb-4">How it works:</h4>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-xs font-medium text-purple-600">1</span>
              </div>
              <p>Complete Stripe onboarding with your business/personal details</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-xs font-medium text-purple-600">2</span>
              </div>
              <p>When someone buys your project, we collect the full payment</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <span className="text-xs font-medium text-purple-600">3</span>
              </div>
              <p>We keep 20% marketplace fee and transfer 80% to your account</p>
            </div>
          </div>
        </div>

        {accountStatus?.hasAccount && !accountStatus?.detailsSubmitted && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-3" />
              <div className="text-yellow-800 text-sm">
                <p className="font-medium">Complete your Stripe setup</p>
                <p>You've started the process but need to finish providing your details.</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={createConnectAccount}
          disabled={creating}
          className="w-full btn btn-primary flex items-center justify-center"
        >
          {creating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Setting up account...
            </>
          ) : (
            <>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" />
              {accountStatus?.hasAccount ? 'Complete Setup' : 'Set Up Payments'}
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          By clicking continue, you'll be redirected to Stripe to complete your account setup.
          This is secure and your information is protected.
        </p>
      </div>
    </div>
  );
};

export default SellerOnboarding;