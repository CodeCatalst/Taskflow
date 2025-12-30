import { useEffect } from 'react';
import { X, AlertTriangle, Trash2, LogOut, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger', 'warning', 'info'
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Variant styles
  const variantStyles = {
    danger: {
      icon: Trash2,
      iconBg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      iconColor: 'text-red-500',
      buttonBg: isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50',
      iconColor: 'text-yellow-500',
      buttonBg: isDark ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-600 hover:bg-yellow-700',
    },
    logout: {
      icon: LogOut,
      iconBg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
      iconColor: 'text-orange-500',
      buttonBg: isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-600 hover:bg-orange-700',
    },
    info: {
      icon: Info,
      iconBg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
      iconColor: 'text-blue-500',
      buttonBg: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.info;
  const Icon = currentVariant.icon;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={!isLoading ? onClose : undefined}
    >
      <div
        className={`relative w-full max-w-md rounded-lg shadow-xl animate-scale-in ${
          isDark ? 'bg-[#1c2027]' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className={`absolute top-4 right-4 p-1 rounded transition-colors ${
            isDark
              ? 'text-[#9da8b9] hover:text-white hover:bg-[#282f39]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full ${currentVariant.iconBg}`}>
              <Icon size={24} className={currentVariant.iconColor} />
            </div>
            <h2 className={`text-xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </h2>
          </div>

          {/* Message */}
          <p className={`text-sm leading-relaxed mb-6 ${
            isDark ? 'text-[#9da8b9]' : 'text-gray-600'
          }`}>
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
                isDark
                  ? 'bg-[#282f39] text-white hover:bg-[#333a47]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded font-medium text-sm text-white transition-colors ${
                currentVariant.buttonBg
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
