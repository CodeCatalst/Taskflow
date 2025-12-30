import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Github, Twitter, Linkedin } from 'lucide-react';

/**
 * Conversion Footer
 * 
 * Strategy: One decisive moment
 * Clear CTA, reinforce value prop, then get out of the way
 * Footer is clean, not noisy
 * 
 * Goal: Convert visitors who scrolled this far (high intent)
 */
const ConversionFooter = () => {
  const navigate = useNavigate();

  return (
    <footer id="contact" className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA section */}
        <div className="text-center space-y-6 sm:space-y-8 mb-16 sm:mb-20 lg:mb-24">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold">
            <span className="block mb-2 sm:mb-3">Ready to Build</span>
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              With Structure?
            </span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto px-4">
            Start with a free community workspace. No credit card. No time limits. Just start.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
            <button 
              onClick={() => navigate('/register')}
              className="group relative px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold text-base sm:text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 text-center"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 rounded-xl" />
            </button>

            <button 
              onClick={() => navigate('/login')}
              className="px-8 sm:px-10 py-4 sm:py-5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 text-center"
            >
              Sign In
            </button>
          </div>

          {/* Trust elements */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-6 sm:pt-8 text-xs sm:text-sm text-slate-500 px-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free forever community tier</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Enterprise ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Real-time collaboration</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-12" />

        {/* Footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-lg font-semibold">TaskFlow</span>
            </div>
            <p className="text-sm text-slate-500">
              Enterprise task management built for teams that think long-term.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-slate-400 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-slate-500 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">Roadmap</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-slate-400 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">Guides</a></li>
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-slate-400 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-slate-500 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-12 mt-12 border-t border-white/10 gap-4">
          <p className="text-sm text-slate-500">
            © 2025 TaskFlow. Built with ❤️ for modern team collaboration.
          </p>

          {/* Social links */}
          <div className="flex items-center space-x-4">
            <a href="#" className="text-slate-500 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>

          {/* Legal links */}
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ConversionFooter;
