import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../Sidebar';
import { Menu } from 'lucide-react';

/**
 * ResponsivePageLayout - A mobile-first responsive layout wrapper
 * 
 * Features:
 * - Mobile-first design with stacked layout on small screens
 * - Responsive header with hamburger menu on mobile
 * - Full-width content areas on mobile, constrained on desktop
 * - Smooth transitions between breakpoints
 * 
 * Breakpoints:
 * - Mobile: < 768px (single column, hamburger menu)
 * - Tablet: 768px - 1024px (sidebar + content)
 * - Desktop: > 1024px (full layout with wider content)
 */
const ResponsivePageLayout = ({
  children,
  title,
  subtitle,
  actions, // Optional action buttons for header
  headerContent, // Optional custom header content
  noPadding = false, // Remove default padding
  maxWidth = "max-w-[1920px]" // Optional max width constraint
}) => {
  const { theme } = useTheme();
  const { toggleMobileSidebar, isMobile } = useSidebar();

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Responsive Header */}
        {(title || headerContent) && (
          <header
            className={`
              flex-none border-b
              ${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'}
              ${noPadding ? '' : 'px-4 sm:px-6 lg:px-8 py-3 sm:py-4'}
            `}
          >
            <div className={`flex items-center justify-between gap-3 sm:gap-4 ${maxWidth} mx-auto w-full`}>
              {/* Left: Mobile Menu + Title */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                {/* Mobile hamburger - only show on mobile */}
                {isMobile && (
                  <button
                    onClick={toggleMobileSidebar}
                    className={`
                      flex-none p-2 rounded-lg
                      ${theme === 'dark'
                        ? 'hover:bg-[#282f39] text-[#9da8b9] hover:text-white'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }
                      transition-colors md:hidden
                    `}
                    aria-label="Toggle menu"
                  >
                    <Menu size={20} />
                  </button>
                )}

                {/* Title Section */}
                {title && (
                  <div className="min-w-0 flex-1">
                    <h1
                      className={`
                        font-bold truncate
                        ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
                        text-lg sm:text-xl lg:text-2xl
                      `}
                    >
                      {title}
                    </h1>
                    {subtitle && (
                      <p
                        className={`
                          text-xs sm:text-sm truncate mt-0.5
                          ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}
                        `}
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}

                {/* Custom header content */}
                {headerContent}
              </div>

              {/* Right: Actions */}
              {actions && (
                <div className="flex items-center gap-2 sm:gap-3 flex-none">
                  {actions}
                </div>
              )}
            </div>
          </header>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          <div className={`${maxWidth} mx-auto w-full h-full ${noPadding ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResponsivePageLayout;
