import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gray-50 dark:bg-[#101822] text-gray-900 dark:text-white transition-colors duration-200">
      <div className="flex h-full grow flex-col items-center justify-center p-4 sm:p-6">
        {/* Login Card */}
        <div className="w-full max-w-[440px] flex flex-col rounded-sm bg-white dark:bg-[#161d27] shadow-sm border border-gray-200 dark:border-[#2a3441] overflow-hidden">
          {/* Header Section */}
          <div className="px-8 pt-10 pb-6 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                TaskFlow
              </h1>
              <p className="text-gray-500 dark:text-[#9da8b9] text-sm font-normal">
                Welcome back. Please enter your details.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 flex flex-col gap-5">
            {/* Work Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 dark:text-white text-sm font-medium">
                Work Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="flex w-full min-w-0 resize-none overflow-hidden rounded-sm text-gray-900 dark:text-white focus:outline-0 focus:ring-1 focus:ring-blue-600 border border-gray-200 dark:border-[#2a3441] bg-white dark:bg-[#1c2430] focus:border-blue-600 h-12 placeholder:text-gray-400 dark:placeholder:text-[#9da8b9] px-4 text-base font-normal transition-colors"
                placeholder="name@company.com"
                required
                data-testid="login-email"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 dark:text-white text-sm font-medium">
                Password
              </label>
              <div className="relative flex w-full items-stretch rounded-sm">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="flex w-full min-w-0 resize-none overflow-hidden rounded-sm text-gray-900 dark:text-white focus:outline-0 focus:ring-1 focus:ring-blue-600 border border-gray-200 dark:border-[#2a3441] bg-white dark:bg-[#1c2430] focus:border-blue-600 h-12 placeholder:text-gray-400 dark:placeholder:text-[#9da8b9] px-4 pr-12 text-base font-normal transition-colors"
                  placeholder="••••••••"
                  required
                  data-testid="login-password"
                />
                <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 dark:text-[#9da8b9] hover:text-gray-600 dark:hover:text-white transition-colors focus:outline-none"
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
                  className="h-4 w-4 rounded-sm border-gray-300 dark:border-[#2a3441] bg-transparent text-blue-600 focus:ring-blue-600 focus:ring-offset-0 transition-colors cursor-pointer"
                />
                <span className="text-gray-700 dark:text-gray-300 text-sm font-normal group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Remember for 30 days
                </span>
              </label>
              <a
                href="#"
                className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:underline transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-sm text-sm" data-testid="login-error">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-sm bg-blue-600 h-12 px-5 text-white text-base font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-[#101822] transition-all mt-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="login-submit"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Footer Link */}
            <div className="pt-2 text-center">
              <p className="text-gray-500 dark:text-[#9da8b9] text-sm font-normal">
                Don't have an account?
                <Link
                  to="#"
                  className="text-gray-900 dark:text-white font-medium hover:underline ml-1"
                >
                  Contact administrator
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Page Footer */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-600 font-normal">
            © 2025 TaskFlow. Enterprise Edition.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;