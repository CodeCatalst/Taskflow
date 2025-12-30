import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Shield, Workflow } from 'lucide-react';

/**
 * Hero Section - The First 5 Seconds
 * 
 * Goal: Establish TaskFlow as a serious platform in one glance
 * Strategy: Cinematic depth + confident messaging + clear escape routes
 * 
 * Motion: Staggered fade-in, subtle floating elements
 * Background: Abstract gradient mesh with floating UI shards
 */
const HeroSection = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  // Subtle parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section 
      ref={heroRef}
      className="relative min-h-[calc(100vh-4rem)] lg:min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20 lg:pt-0"
    >
      {/* Advanced animated background */}
      <div className="absolute inset-0">
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)] opacity-30" />
        
        {/* Spotlight effect following mouse */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)`,
            left: '50%',
            top: '50%',
            marginLeft: '-300px',
            marginTop: '-300px',
            transition: 'transform 0.3s ease-out',
          }}
        />
        
        {/* Primary gradient orbs with enhanced blur */}
        <div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-float"
          style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-float-delayed"
          style={{ transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)` }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-slow"
        />
        
        {/* Floating particles */}
        <FloatingParticles />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-[1.1fr,1fr] gap-12 lg:gap-20 items-center">
          {/* Left side - Content */}
          <div className="space-y-6 lg:space-y-8 animate-fade-in-up text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            {/* Logo + Brand */}
            <div className="flex justify-center lg:justify-start items-center space-x-4 animate-fade-in">
              <img 
                src="/logo.png" 
                alt="TaskFlow Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-2xl shadow-blue-500/30 ring-2 ring-white/10"
              />
              <div className="text-left">
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  TaskFlow
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Enterprise Task Management</p>
              </div>
            </div>

            {/* Badge */}
            <div className="flex justify-center lg:justify-start animate-fade-in">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">
                  Production-ready task management for serious teams
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight animate-fade-in-up animation-delay-100 leading-[1.1]">
              <span className="block text-white mb-3 lg:mb-4">The Operating System</span>
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                For Team Momentum
              </span>
            </h1>

            {/* Subtext */}
            <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-slate-400 leading-relaxed animate-fade-in-up animation-delay-200">
              Multi-workspace architecture. Role-based governance. Real-time analytics. 
              Built for teams that need clarity, control, and scale.
            </p>

            {/* Key Features */}
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start animate-fade-in-up animation-delay-250">
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>Real-time Sync</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Role-Based Access</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Workflow className="w-4 h-4 text-indigo-400" />
                <span>Multi-Workspace</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 animate-fade-in-up animation-delay-300">
              <button 
                onClick={() => navigate('/register')}
                className="group relative px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 text-center"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Start Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 rounded-xl" />
              </button>

              <button 
                onClick={() => {
                  const section = document.getElementById('pricing');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/30 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="flex items-center space-x-2">
                  <span>View Pricing</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-sm text-slate-500 animate-fade-in-up animation-delay-400">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Instant setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Free forever</span>
              </div>
            </div>
          </div>

          {/* Right side - Screenshot Showcase */}
          <div className="relative animate-fade-in-up animation-delay-200 hidden lg:block lg:min-h-[650px]">
            <ScreenshotShowcase />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-white/60 rounded-full animate-scroll" />
        </div>
      </div>
    </section>
  );
};

/**
 * Floating Particles - Subtle background animation
 */
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Screenshot Showcase - Bento-style layout of real app screenshots
 */
const ScreenshotShowcase = () => {
  return (
    <div className="relative w-full h-full min-h-[600px]">
      {/* Main spotlight effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 blur-3xl" />
      
      {/* Bento grid layout */}
      <div className="relative grid grid-cols-12 grid-rows-12 gap-3 h-full">
        {/* Large dashboard screenshot - Top left */}
        <div 
          className="col-span-7 row-span-7 group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-[1.02]"
          style={{ animation: 'fade-in-up 0.6s ease-out' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img 
            src="/UI/main_dashboard/screen.png" 
            alt="TaskFlow Dashboard"
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-xs font-semibold text-white bg-blue-600/90 px-3 py-1 rounded-full">Dashboard</span>
          </div>
        </div>

        {/* Kanban board - Top right */}
        <div 
          className="col-span-5 row-span-5 group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 hover:scale-[1.02]"
          style={{ animation: 'fade-in-up 0.7s ease-out' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img 
            src="/UI/kanban_board/screen.png" 
            alt="Kanban Board"
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-xs font-semibold text-white bg-cyan-600/90 px-3 py-1 rounded-full">Kanban</span>
          </div>
        </div>

        {/* Analytics - Bottom left */}
        <div 
          className="col-span-5 row-span-5 group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 hover:scale-[1.02]"
          style={{ animation: 'fade-in-up 0.8s ease-out' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img 
            src="/UI/analytics_&_reports/screen.png" 
            alt="Analytics Dashboard"
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-xs font-semibold text-white bg-indigo-600/90 px-3 py-1 rounded-full">Analytics</span>
          </div>
        </div>

        {/* Calendar view - Bottom right */}
        <div 
          className="col-span-7 row-span-5 group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02]"
          style={{ animation: 'fade-in-up 0.9s ease-out' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img 
            src="/UI/calendar_view/screen.png" 
            alt="Calendar View"
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-xs font-semibold text-white bg-purple-600/90 px-3 py-1 rounded-full">Calendar</span>
          </div>
        </div>

        {/* Floating badge - "See it in action" */}
        <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-pulse">
          Live Product ✨
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
