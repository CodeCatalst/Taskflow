import React, { useEffect, useRef, useState } from 'react';
import { Shield, Users, Zap, BarChart3, Lock, GitBranch } from 'lucide-react';

/**
 * Trust by Architecture Section
 * 
 * Strategy: Show capability density, not testimonials
 * We prove credibility through technical sophistication
 * 
 * Motion: Cards reveal on scroll with staggered animation
 * Interaction: Hover reveals deeper detail without navigation
 */
const TrustArchitecture = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

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
      ref={sectionRef}
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className={`text-center space-y-3 sm:space-y-4 mb-12 sm:mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Built for <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Scale & Governance</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto">
            Enterprise architecture. Community accessibility. 
            No compromises.
          </p>
        </div>

        {/* Capability grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CapabilityCard 
            icon={GitBranch}
            title="Multi-Workspace Architecture"
            description="Complete data isolation. System admins govern all. Workspace admins control their domain."
            details={['CORE & COMMUNITY tiers', 'Cross-workspace management', 'Instant provisioning']}
            delay={0}
            isVisible={isVisible}
          />

          <CapabilityCard 
            icon={Shield}
            title="Role-Based Hierarchy"
            description="Six role levels. Precise permissions. From System Admin to Member, everyone has their scope."
            details={['System Admin', 'Workspace Admin', 'HR, Team Lead, Member']}
            delay={100}
            isVisible={isVisible}
          />

          <CapabilityCard 
            icon={Zap}
            title="Real-Time Everything"
            description="Socket.IO powers instant sync. Multi-tab. Multi-user. Zero refresh needed."
            details={['Live task updates', 'Real-time notifications', 'Collaborative editing']}
            delay={200}
            isVisible={isVisible}
          />

          <CapabilityCard 
            icon={BarChart3}
            title="Analytics Depth"
            description="11 comprehensive graphs. Track completion trends, team velocity, bottlenecks."
            details={['Custom date ranges', 'Export to Excel & PDF', 'Mobile-optimized charts']}
            delay={300}
            isVisible={isVisible}
          />

          <CapabilityCard 
            icon={Lock}
            title="Audit & Compliance"
            description="Every action logged. Full audit trail for CORE workspaces. Built for regulated industries."
            details={['Complete change logs', 'User action tracking', 'Exportable audit trails']}
            delay={400}
            isVisible={isVisible}
          />

          <CapabilityCard 
            icon={Users}
            title="Automated Workflows"
            description="Welcome emails. Overdue reminders. Weekly reports. Let the system handle the routine."
            details={['Bulk user import', 'Email automation', 'Scheduled reporting']}
            delay={500}
            isVisible={isVisible}
          />
        </div>

        {/* Architecture diagram hint */}
        <div className={`mt-20 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10 blur-3xl" />
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-blue-400">6</div>
                  <div className="text-sm text-slate-400">Role Levels</div>
                  <div className="text-xs text-slate-500">Granular permissions</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-cyan-400">∞</div>
                  <div className="text-sm text-slate-400">Workspaces</div>
                  <div className="text-xs text-slate-500">Multi-tenant ready</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-indigo-400">11</div>
                  <div className="text-sm text-slate-400">Analytics Graphs</div>
                  <div className="text-xs text-slate-500">Real-time insights</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Capability Card Component
 * Hover reveals deeper details without leaving the page
 */
const CapabilityCard = ({ icon: Icon, title, description, details, delay, isVisible }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`group relative transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl transition-opacity duration-500 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />

      {/* Card */}
      <div className="relative h-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-4px]">
        {/* Icon */}
        <div className="mb-4">
          <div className="inline-flex p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">{description}</p>

        {/* Details reveal on hover */}
        <div className={`space-y-1 transition-all duration-300 ${
          isHovered ? 'opacity-100 max-h-32' : 'opacity-0 max-h-0'
        } overflow-hidden`}>
          {details.map((detail, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs text-slate-500">
              <div className="w-1 h-1 bg-blue-400 rounded-full" />
              <span>{detail}</span>
            </div>
          ))}
        </div>

        {/* Hover indicator */}
        <div className={`mt-4 text-xs text-blue-400 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          →
        </div>
      </div>
    </div>
  );
};

export default TrustArchitecture;
