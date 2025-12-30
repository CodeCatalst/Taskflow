import React, { useEffect, useRef, useState } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Pricing Comparison - Community vs CORE
 * 
 * Strategy: Spatial hierarchy over tables
 * Show that Community is generous, CORE is powerful
 * No tricks, no urgency tactics, just clear value
 * 
 * Motion: Floating panels that separate on scroll
 * Interaction: Hover emphasis, clear CTAs
 */
const PricingComparison = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="pricing"
      ref={sectionRef}
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className={`text-center space-y-3 sm:space-y-4 mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Start <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Free</span>, Scale When Ready
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto">
            Community tier is real. CORE tier removes all limits.
          </p>
        </div>

        {/* Pricing panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Community Tier */}
          <div className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`}>
            <div className="relative h-full">
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 blur-3xl opacity-60" />
              
              {/* Card */}
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full flex flex-col">
                {/* Header */}
                <div className="mb-8">
                  <div className="inline-flex px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-medium text-green-400 mb-4">
                    FREE FOREVER
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Community</h3>
                  <p className="text-slate-400">Perfect for small teams getting started</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold">$0</span>
                    <span className="text-slate-500 ml-2">/forever</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 flex-1 mb-8">
                  <Feature included text="Up to 10 users" />
                  <Feature included text="Up to 100 tasks" />
                  <Feature included text="Up to 3 teams" />
                  <Feature included text="Full task management" />
                  <Feature included text="Kanban board" />
                  <Feature included text="Calendar view" />
                  <Feature included text="Real-time sync" />
                  <Feature included text="Mobile PWA" />
                  <Feature included text="Basic analytics" />
                  <Feature text="No bulk user import" />
                  <Feature text="No audit logs" />
                  <Feature text="Limited automation" />
                </div>

                {/* CTA */}
                <button 
                  onClick={() => navigate('/register')}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-semibold shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>Create Free Workspace</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-xs text-slate-500 text-center mt-4">
                  No credit card required • Instant setup
                </p>
              </div>
            </div>
          </div>

          {/* CORE Tier */}
          <div className={`transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
            <div className="relative h-full">
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 blur-3xl opacity-80" />
              
              {/* Card */}
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 h-full flex flex-col">
                {/* Header */}
                <div className="mb-8">
                  <div className="inline-flex px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-medium text-blue-400 mb-4">
                    ENTERPRISE
                  </div>
                  <h3 className="text-3xl font-bold mb-2">CORE</h3>
                  <p className="text-slate-400">Unlimited power for serious teams</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold">Custom</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Contact for pricing</p>
                </div>

                {/* Features */}
                <div className="space-y-4 flex-1 mb-8">
                  <Feature included highlight text="Unlimited users" />
                  <Feature included highlight text="Unlimited tasks" />
                  <Feature included highlight text="Unlimited teams" />
                  <Feature included highlight text="Everything in Community" />
                  <Feature included highlight text="Bulk user import (Excel/CSV)" />
                  <Feature included highlight text="Complete audit logs" />
                  <Feature included highlight text="Advanced automation" />
                  <Feature included highlight text="Email workflows" />
                  <Feature included highlight text="Weekly reports" />
                  <Feature included highlight text="Full analytics suite (11 graphs)" />
                  <Feature included highlight text="Priority support" />
                  <Feature included highlight text="Custom integrations" />
                </div>

                {/* CTA */}
                <button 
                  onClick={() => {
                    const footer = document.getElementById('contact');
                    footer?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>Contact Sales</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-xs text-slate-500 text-center mt-4">
                  Custom deployment • Dedicated support
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison note */}
        <div className={`text-center mt-16 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm text-slate-300">
              Both tiers include real-time sync, mobile PWA, and complete data isolation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Feature line component
 */
const Feature = ({ included = true, text, highlight = false }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
        included 
          ? highlight 
            ? 'bg-blue-500/20 border border-blue-500/50' 
            : 'bg-white/10 border border-white/20'
          : 'bg-white/5 border border-white/10'
      }`}>
        {included ? (
          <Check className={`w-3 h-3 ${highlight ? 'text-blue-400' : 'text-white'}`} />
        ) : (
          <X className="w-3 h-3 text-slate-600" />
        )}
      </div>
      <span className={`text-sm ${
        included 
          ? highlight 
            ? 'text-white font-medium' 
            : 'text-slate-300'
          : 'text-slate-600'
      }`}>
        {text}
      </span>
    </div>
  );
};

export default PricingComparison;
