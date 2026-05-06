import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

const ResetPassword = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="TaskFlow" className="w-12 h-12" />
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              TaskFlow
            </h1>
          </div>
        </div>

        {/* Card */}
        <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded-lg shadow-xl p-8`}>
          {!success ? (
            <>
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${theme === 'dark' ? 'bg-[#136dec]/10' : 'bg-blue-50'}`}>
                  <Lock size={32} className="text-[#136dec]" />
                </div>
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Reset Password
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                  Enter your new password below
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              {!token ? (
                <div className="text-center py-4">
                  <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-4`}>
                    Invalid or missing reset token.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="text-[#136dec] hover:underline text-sm font-medium"
                  >
                    Request a new password reset
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                        className={`w-full p-3 pr-10 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white placeholder:text-[#58606e]' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                        required
                        minLength={6}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className={`w-full p-3 pr-10 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white placeholder:text-[#58606e]' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#136dec] text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                >
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-green-500/10">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                Password Reset Successful!
              </h2>
              <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-6`}>
                Your password has been successfully reset. Redirecting to login...
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-[#136dec] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-[#136dec] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[#136dec] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
            © 2026 TaskFlow. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
