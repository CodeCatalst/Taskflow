import React, { useEffect, useRef, useState } from 'react';
import { Calendar, LayoutGrid, BarChart2 } from 'lucide-react';

/**
 * Product Experience Preview
 * 
 * Strategy: Show, don't tell
 * Animated mock UI sections that feel like a live demo
 * No screenshots. No videos. Just clean, animated UI blocks.
 * 
 * Motion: Sequential reveal as user scrolls
 * Each preview paired with one sharp sentence
 */
const ProductExperience = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activePreview, setActivePreview] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className={`text-center space-y-3 sm:space-y-4 mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Interface Clarity
            </span> Meets Power
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto">
            Three views. One source of truth. Zero friction.
          </p>
        </div>

        {/* Preview sections */}
        <div className="space-y-32">
          {/* Dashboard Analytics Preview */}
          <PreviewSection
            icon={BarChart2}
            title="Dashboard Intelligence"
            description="11 real-time graphs. Search that works. Filters that make sense."
            isVisible={isVisible}
            delay={0}
          >
            <DashboardPreview />
          </PreviewSection>

          {/* Kanban Preview */}
          <PreviewSection
            icon={LayoutGrid}
            title="Kanban Flow"
            description="Drag tasks across status columns. Updates sync instantly. No page refresh."
            isVisible={isVisible}
            delay={200}
            reverse
          >
            <KanbanPreview />
          </PreviewSection>

          {/* Calendar Preview */}
          <PreviewSection
            icon={Calendar}
            title="Calendar Context"
            description="Due dates visualized. Task density at a glance. Plan with confidence."
            isVisible={isVisible}
            delay={400}
          >
            <CalendarPreview />
          </PreviewSection>
        </div>
      </div>
    </section>
  );
};

/**
 * Preview Section Wrapper
 * Alternating left/right layout with animated reveal
 */
const PreviewSection = ({ icon: Icon, title, description, children, isVisible, delay, reverse = false }) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 ${
      isVisible ? 'opacity-100 translate-x-0' : `opacity-0 ${reverse ? 'translate-x-8' : '-translate-x-8'}`
    }`}
    style={{ transitionDelay: `${delay}ms` }}>
      {/* Text content */}
      <div className={`space-y-6 ${reverse ? 'lg:order-2' : ''}`}>
        <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl">
          <Icon className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-3xl sm:text-4xl font-bold">{title}</h3>
        <p className="text-lg text-slate-400 leading-relaxed">{description}</p>
      </div>

      {/* UI Preview */}
      <div className={reverse ? 'lg:order-1' : ''}>
        {children}
      </div>
    </div>
  );
};

/**
 * Dashboard Analytics Mock UI
 */
const DashboardPreview = () => {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl" />
      
      {/* Mock dashboard */}
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1">
            <div className="text-2xl font-bold text-blue-400 animate-count-up">127</div>
            <div className="text-xs text-slate-500">Active Tasks</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1">
            <div className="text-2xl font-bold text-green-400 animate-count-up">84%</div>
            <div className="text-xs text-slate-500">Completion</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1">
            <div className="text-2xl font-bold text-violet-400 animate-count-up">6</div>
            <div className="text-xs text-slate-500">Teams</div>
          </div>
        </div>

        {/* Charts preview */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pie chart mock */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-3">Status Distribution</div>
            <div className="flex items-center justify-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="8" />
                  <circle 
                    cx="48" cy="48" r="40" fill="none" 
                    stroke="rgb(59, 130, 246)" strokeWidth="8"
                    strokeDasharray="251.2" strokeDashoffset="62.8"
                    className="animate-draw-circle"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Bar chart mock */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-3">Team Activity</div>
            <div className="flex items-end justify-between h-16 space-x-1">
              <div className="w-full bg-blue-500/40 rounded-t animate-grow-bar" style={{ height: '60%', animationDelay: '0ms' }} />
              <div className="w-full bg-cyan-500/40 rounded-t animate-grow-bar" style={{ height: '80%', animationDelay: '100ms' }} />
              <div className="w-full bg-indigo-500/40 rounded-t animate-grow-bar" style={{ height: '45%', animationDelay: '200ms' }} />
              <div className="w-full bg-blue-500/40 rounded-t animate-grow-bar" style={{ height: '90%', animationDelay: '300ms' }} />
            </div>
          </div>
        </div>

        {/* Search bar preview */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center space-x-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div className="flex-1 h-4 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};

/**
 * Kanban Board Mock UI
 */
const KanbanPreview = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl" />
      
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-3 gap-3">
          {/* Todo column */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-medium mb-2">To Do</div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2 animate-slide-in-left" style={{ animationDelay: '0ms' }}>
              <div className="w-16 h-2 bg-blue-500/60 rounded" />
              <div className="w-full h-2 bg-white/20 rounded" />
              <div className="w-3/4 h-2 bg-white/20 rounded" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2 animate-slide-in-left" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-2 bg-green-500/60 rounded" />
              <div className="w-full h-2 bg-white/20 rounded" />
            </div>
          </div>

          {/* In Progress column */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-medium mb-2">In Progress</div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2 animate-slide-in-left" style={{ animationDelay: '200ms' }}>
              <div className="w-16 h-2 bg-cyan-500/60 rounded" />
              <div className="w-full h-2 bg-white/20 rounded" />
              <div className="w-3/4 h-2 bg-white/20 rounded" />
            </div>
          </div>

          {/* Done column */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-medium mb-2">Done</div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2 animate-slide-in-left" style={{ animationDelay: '300ms' }}>
              <div className="w-16 h-2 bg-indigo-500/60 rounded" />
              <div className="w-full h-2 bg-white/20 rounded" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2 animate-slide-in-left" style={{ animationDelay: '400ms' }}>
              <div className="w-16 h-2 bg-blue-500/60 rounded" />
              <div className="w-full h-2 bg-white/20 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Calendar Mock UI
 */
const CalendarPreview = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 blur-3xl" />
      
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium">December 2025</div>
          <div className="flex space-x-1">
            <div className="w-6 h-6 bg-white/5 rounded" />
            <div className="w-6 h-6 bg-white/5 rounded" />
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-xs text-slate-500 text-center py-1">{day}</div>
          ))}
          
          {/* Days */}
          {Array.from({ length: 35 }).map((_, i) => {
            const hasTask = [5, 8, 12, 18, 22, 27].includes(i);
            const isPast = i < 15;
            return (
              <div 
                key={i} 
                className={`aspect-square flex items-center justify-center text-xs rounded transition-all duration-300 ${
                  hasTask 
                    ? 'bg-blue-500/20 border border-blue-500/40 animate-fade-in' 
                    : 'bg-white/5'
                } ${isPast ? 'text-slate-600' : 'text-slate-300'}`}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductExperience;
