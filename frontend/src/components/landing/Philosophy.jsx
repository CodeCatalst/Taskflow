import React, { useEffect, useRef, useState } from 'react';

/**
 * Philosophy Section
 * 
 * Strategy: Human, grounded, confident
 * No CTA. Just clarity about why TaskFlow exists.
 * This builds trust through calm honesty.
 * 
 * Visual: Minimal. Words matter here.
 * Motion: Gentle fade-in, nothing flashy
 */
const Philosophy = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
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
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`space-y-8 sm:space-y-10 lg:space-y-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Why TaskFlow Exists
            </h2>
            <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full" />
          </div>

          {/* Philosophy blocks */}
          <div className="space-y-6 sm:space-y-8 text-base sm:text-lg leading-relaxed">
            <p className="text-slate-300">
              Work breaks when systems don't scale with thinking.
            </p>

            <p className="text-slate-400">
              Most task tools are built for individuals. They add features, not architecture. 
              When teams grow, when stakes rise, when compliance matters—those tools bend.
            </p>

            <p className="text-slate-400">
              TaskFlow was built to survive complexity. Multi-workspace isolation. 
              Role hierarchies that map to real organizations. Audit trails that mean something. 
              Real-time sync that doesn't break under load.
            </p>

            <p className="text-slate-300">
              This is for teams that plan long-term. Teams that need governance, not just productivity. 
              Teams that want a system they won't outgrow.
            </p>

            <div className="pt-8">
              <div className="bg-white/5 border-l-4 border-blue-500 rounded-lg p-6">
                <p className="text-slate-300 italic">
                  "A task management system should disappear into your workflow, 
                  not become the workflow itself."
                </p>
              </div>
            </div>
          </div>

          {/* Principles grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <Principle 
              number="01"
              title="Architecture First"
              description="Multi-tenancy, role isolation, and data separation aren't add-ons. They're foundational."
            />
            <Principle 
              number="02"
              title="Clarity Over Cuteness"
              description="No gamification. No unnecessary animations. Just clear information when you need it."
            />
            <Principle 
              number="03"
              title="Scale Without Friction"
              description="Start with 3 people or 300. The system adapts without configuration hell."
            />
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Principle card - minimal design
 */
const Principle = ({ number, title, description }) => {
  return (
    <div className="space-y-3">
      <div className="text-4xl font-bold text-blue-500/40">{number}</div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
};

export default Philosophy;
