import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import WorkspaceSelector from '../components/WorkspaceSelector';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, selectWorkspace } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [accountDeactivated, setAccountDeactivated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Workspace selection state
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);
  const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
  const [loginUserData, setLoginUserData] = useState(null);

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setAccountDeactivated(false);
    setLoading(true);

    const result = await login(formData.email, formData.password);
    console.log('Login result:', result);

    if (result.success) {
      // Check if workspace selection is required
      if (result.requiresWorkspaceSelection) {
        console.log('Multiple workspaces detected:', result.workspaces);
        setLoginUserData(result.user);
        setAvailableWorkspaces(result.workspaces);
        setShowWorkspaceSelector(true);
      } else {
        // Single workspace - navigate directly
        console.log('Single workspace, navigating to dashboard');
        navigate('/dashboard');
      }
    } else {
      setError(result.message);

      // Check if verification is required
      if (result.requiresVerification) {
        setNeedsVerification(true);
      }

      // Check if account is deactivated
      if (result.accountDeactivated) {
        setAccountDeactivated(true);
      }
    }
    setLoading(false);
  };

  const handleWorkspaceSelect = async (workspace) => {
    console.log('handleWorkspaceSelect called with:', workspace);
    try {
      const result = await selectWorkspace(workspace, loginUserData);
      console.log('selectWorkspace result:', result);
      if (result.success) {
        console.log('Navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.error('Workspace selection failed:', result);
        setError(result.message || 'Failed to select workspace. Please try again.');
        setShowWorkspaceSelector(false);
      }
    } catch (error) {
      console.error('Error in handleWorkspaceSelect:', error);
      setError('An error occurred while selecting workspace.');
      setShowWorkspaceSelector(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Show workspace selector if needed
  if (showWorkspaceSelector) {
    return (
      <WorkspaceSelector
        workspaces={availableWorkspaces}
        onSelect={handleWorkspaceSelect}
        userEmail={formData.email}
        isAdmin={loginUserData?.role === 'admin'}
      />
    );
  }

  return (
    <div className={`relative flex min-h-screen w-full flex-col ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      <div className="flex h-full grow flex-col items-center justify-center p-4 sm:p-6">
        {/* Login Card */}
        <div className={`w-full max-w-[440px] flex flex-col rounded border ${theme === 'dark' ? 'border-[#282f39] bg-[#1c2027]' : 'border-gray-200 bg-white'} shadow-lg overflow-hidden`}>
          {/* Header Section */}
          <div className="px-8 pt-10 pb-6 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h1 className={`text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                TaskFlow
              </h1>
              <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-sm font-normal`}>
                Welcome back. Please enter your details.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 flex flex-col gap-5">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-start gap-3">
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{successMessage}</span>
              </div>
            )}

            {/* Work Email Field */}
            <div className="flex flex-col gap-2">
              <label className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm font-medium`}>
                Work Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`flex w-full min-w-0 resize-none overflow-hidden rounded ${theme === 'dark' ? 'text-white border-[#282f39] bg-[#111418] placeholder:text-[#9da8b9]' : 'text-gray-900 border-gray-300 bg-white placeholder:text-gray-400'} focus:outline-0 focus:ring-2 focus:ring-[#136dec] border focus:border-[#136dec] h-12 px-4 text-base font-normal transition-colors`}
                placeholder="name@company.com"
                required
                data-testid="login-email"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm font-medium`}>
                Password
              </label>
              <div className="relative flex w-full items-stretch rounded">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`flex w-full min-w-0 resize-none overflow-hidden rounded ${theme === 'dark' ? 'text-white border-[#282f39] bg-[#111418] placeholder:text-[#9da8b9]' : 'text-gray-900 border-gray-300 bg-white placeholder:text-gray-400'} focus:outline-0 focus:ring-2 focus:ring-[#136dec] border focus:border-[#136dec] h-12 px-4 pr-12 text-base font-normal transition-colors`}
                  placeholder="••••••••"
                  required
                  data-testid="login-password"
                />
                <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors focus:outline-none`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex flex-wrap items-center justify-between gap-y-2 mt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`h-4 w-4 rounded ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-300'} bg-transparent text-[#136dec] focus:ring-[#136dec] focus:ring-offset-0 transition-colors cursor-pointer`}
                />
                <span className={`${theme === 'dark' ? 'text-[#9da8b9] group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'} text-sm font-normal transition-colors`}>
                  Remember for 30 days
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[#136dec] text-sm font-medium hover:text-blue-400 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-start gap-3" data-testid="login-error">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p>{error}</p>
                  {needsVerification && (
                    <button
                      type="button"
                      onClick={() => navigate('/verify-email', { state: { email: formData.email } })}
                      className="mt-2 text-red-600 dark:text-red-400 underline hover:text-red-800 dark:hover:text-red-300 font-semibold"
                    >
                      Go to verification page →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`flex w-full items-center justify-center rounded bg-[#136dec] h-12 px-5 text-white text-base font-bold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#136dec] focus:ring-offset-2 ${theme === 'dark' ? 'focus:ring-offset-[#111418]' : 'focus:ring-offset-white'} transition-all mt-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              data-testid="login-submit"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Footer Links */}
            <div className="pt-2 text-center space-y-2">
              <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-sm font-normal`}>
                Need a workspace?
                <Link
                  to="/register-community"
                  className="text-[#136dec] font-medium hover:underline ml-1"
                >
                  Create Community Workspace
                </Link>
              </p>
              <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-xs font-normal`}>
                Already have an invitation? Contact your administrator
              </p>
            </div>
          </form>
        </div>

        {/* Account Deactivated Modal */}
        {accountDeactivated && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-6 max-w-md w-full`}>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Account Deactivated
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-6`}>
                  Your account has been deactivated and you are denied access to the system. Please contact your administrator for assistance.
                </p>
                <button
                  onClick={() => setAccountDeactivated(false)}
                  className="w-full bg-[#136dec] hover:bg-[#1258c4] text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Footer */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} font-normal`}>
            © 2025 TaskFlow. Enterprise Edition.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;