import React, { useState } from 'react';
import axios from 'axios';
import {
  GlobeAltIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DomainVerificationProps {
  projectId: string;
  onVerified: (domain: string) => void;
}

const DomainVerification: React.FC<DomainVerificationProps> = ({ projectId, onVerified }) => {
  const [domain, setDomain] = useState('');
  const [verificationData, setVerificationData] = useState<{
    verificationPath: string;
    verificationContent: string;
    instructions: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const generateToken = async () => {
    if (!domain) {
      setError('Please enter a domain');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/verification/domain/generate-token', {
        projectId,
        domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      });

      setVerificationData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate verification token');
    } finally {
      setLoading(false);
    }
  };

  const verifyDomain = async () => {
    setVerifying(true);
    setError('');

    try {
      const response = await axios.post('/verification/domain/verify', {
        projectId
      });

      if (response.data.success) {
        setSuccess(true);
        onVerified(response.data.domain);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Domain Verification
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Verify ownership of your domain by uploading a verification file
        </p>

        {!verificationData && !success && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Domain
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={generateToken}
                  disabled={loading || !domain}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <GlobeAltIcon className="w-4 h-4" />
                  )}
                  <span>Generate Token</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {verificationData && !success && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h4 className="font-medium text-gray-900">Verification Instructions</h4>
            
            <div className="space-y-3">
              <div className="bg-white rounded p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  1. Create a file named:
                </p>
                <div className="flex items-center justify-between bg-gray-100 rounded p-2">
                  <code className="text-xs">{verificationData.verificationPath}</code>
                  <button
                    onClick={() => copyToClipboard(verificationData.verificationPath)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  2. Add this content to the file:
                </p>
                <div className="bg-gray-100 rounded p-2">
                  <pre className="text-xs overflow-x-auto">{verificationData.verificationContent}</pre>
                  <button
                    onClick={() => copyToClipboard(verificationData.verificationContent)}
                    className="mt-2 text-purple-600 hover:text-purple-800 flex items-center space-x-1 text-sm"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    <span>Copy Content</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  3. Upload the file to:
                </p>
                <code className="text-xs bg-gray-100 rounded p-2 block">
                  https://{domain}/{verificationData.verificationPath}
                </code>
              </div>
            </div>

            <button
              onClick={verifyDomain}
              disabled={verifying}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {verifying ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Verify Domain</span>
                </>
              )}
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-green-800 font-medium">Domain Verified!</h4>
                <p className="text-green-700 text-sm mt-1">
                  Your domain ownership has been successfully verified.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Alternative Verification Methods
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• NPM Package Verification</li>
          <li>• GitLab Integration</li>
          <li>• Bitbucket Integration</li>
          <li>• Website Meta Tag Verification</li>
        </ul>
      </div>
    </div>
  );
};

export default DomainVerification;