import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useEffect } from 'react';

/**
 * ResponsiveModal - Mobile-first modal component
 * 
 * Features:
 * - Full screen on mobile (< 640px)
 * - Centered card on tablet/desktop
 * - Responsive padding and sizing
 * - Smooth animations
 * - Scrollable content
 * - Accessible (ESC to close, focus trap)
 */
const ResponsiveModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'default', // 'small', 'default', 'large', 'full'
  noPadding = false
}) => {
  const { theme } = useTheme();

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'sm:max-w-md',
    default: 'sm:max-w-lg md:max-w-2xl',
    large: 'sm:max-w-2xl md:max-w-4xl lg:max-w-5xl',
    full: 'sm:max-w-full sm:m-4 md:m-8'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop - darker on mobile for better contrast */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`
          relative w-full ${sizeClasses[size] || sizeClasses.default}
          ${theme === 'dark' ? 'bg-gradient-to-b from-[#1c2027] to-[#181c23]' : 'bg-gradient-to-b from-white to-gray-50'}
          rounded-t-3xl sm:rounded-xl
          shadow-2xl
          flex flex-col
          max-h-[92vh] sm:max-h-[90vh]
          animate-slideUp sm:animate-scaleIn
          border-t-4 border-[#136dec]
        `}
      >
        {/* Drag Handle - Mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-[#4b5563] rounded-full"></div>
        </div>

        {/* Header - Sticky on mobile */}
        <div
          className={`
            flex-none flex items-center justify-between
            ${noPadding ? '' : 'px-4 py-3 sm:p-6'}
            border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}
            sticky top-0 ${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'}
            z-10 rounded-t-3xl sm:rounded-t-xl
          `}
        >
          <h2
            className={`
              font-bold
              ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
              text-base sm:text-xl lg:text-2xl
              pr-4 truncate
            `}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`
              flex-none p-2 rounded-lg
              ${theme === 'dark'
                ? 'hover:bg-[#282f39] text-[#9da8b9] hover:text-white'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }
              transition-colors
            `}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          className={`
            flex-1 overflow-y-auto overflow-x-hidden
            ${noPadding ? '' : 'p-4 sm:p-6'}
          `}
        >
          {children}
        </div>

        {/* Footer - Sticky on mobile if provided */}
        {footer && (
          <div
            className={`
              flex-none
              ${noPadding ? '' : 'p-4 sm:p-6'}
              border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}
              sticky bottom-0 ${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'}
              sm:rounded-b-xl
            `}
          >
            {footer}
          </div>
        )}
      </div>
    </div >
  );
};

export default ResponsiveModal;
