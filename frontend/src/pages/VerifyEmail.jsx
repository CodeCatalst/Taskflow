import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [verificationCode, setVerificationCode] = useState(searchParams.get('code') || '');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  // Auto-verify if code is in URL
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && email) {
      handleVerify();
    }
  }, []);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    
    if (!email || !verificationCode) {
      setError('Please enter both email and verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-email', {
        email,
        code: verificationCode
      });

      setSuccess(true);
      setError('');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Email verified! Please login with your credentials.',
            email: email 
          }
        });
      }, 3000);
    } catch (error) {
      console.error('Verification error:', error);
      setError(
        error.response?.data?.message || 
        'Verification failed. Please check your code and try again.'
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setResending(true);
    setError('');

    try {
      await api.post('/auth/resend-verification', { email });
      setError('');
      alert('Verification code resent! Please check your email inbox.');
    } catch (error) {
      console.error('Resend error:', error);
      setError(
        error.response?.data?.message || 
        'Failed to resend verification code. Please try again.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back to Login */}
        <button
          onClick={() => navigate('/login')}
          className="mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Login</span>
        </button>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              {success ? (
                <CheckCircle size={40} className="text-green-500" />
              ) : (
                <Mail size={40} className="text-purple-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {success ? 'Verified!' : 'Verify Your Email'}
            </h1>
            <p className="text-white/90 text-sm">
              {success 
                ? 'Your email has been verified successfully' 
                : 'Enter the 6-digit code sent to your email'}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {success ? (
              <div className="text-center">
                <div className="mb-6">
                  <CheckCircle size={80} className="text-green-500 mx-auto" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Email Verified! 🎉
                </h2>
                <p className="text-gray-600 mb-6">
                  Redirecting you to login page...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Verification Code Input */}
                <div>
                  <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono font-bold tracking-widest focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    maxLength={6}
                    required
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                    <XCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || !email || !verificationCode}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      <span>Verify Email</span>
                    </>
                  )}
                </button>

                {/* Resend Code */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resending || !email}
                    className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
                    <span>{resending ? 'Resending...' : 'Resend Code'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need help?{' '}
                <a href="mailto:support@taskflow.com" className="text-purple-600 hover:text-purple-700 font-semibold">
                  Contact Support
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        {!success && (
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
            <p className="font-semibold mb-2">📧 Check your email inbox</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>The code is valid for 24 hours</li>
              <li>Check your spam folder if you don't see it</li>
              <li>You can request a new code if it expired</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
