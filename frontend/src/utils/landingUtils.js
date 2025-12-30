/**
 * Landing Page Utilities
 * 
 * Reusable hooks and helpers for the landing page
 */

import { useEffect, useState, useRef } from 'react';

/**
 * useScrollReveal
 * 
 * Reveals element when it enters viewport
 * Uses Intersection Observer for performance
 * 
 * @param {number} threshold - Percentage of element visible to trigger (0-1)
 * @param {boolean} triggerOnce - Only trigger once (default: true)
 * @returns {[ref, isVisible]} - Ref to attach to element + visibility state
 */
export const useScrollReveal = (threshold = 0.2, triggerOnce = true) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return [ref, isVisible];
};

/**
 * useParallax
 * 
 * Tracks mouse position for parallax effects
 * Throttled for performance
 * 
 * @returns {{ x: number, y: number }} - Mouse position normalized (-1 to 1)
 */
export const useParallax = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId;

    const handleMouseMove = (e) => {
      if (animationFrameId) return;

      animationFrameId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        setMousePos({ x, y });
        animationFrameId = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return mousePos;
};

/**
 * useScrollProgress
 * 
 * Tracks scroll progress through the page
 * 
 * @returns {number} - Scroll progress (0 to 1)
 */
export const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercentage = scrollTop / (documentHeight - windowHeight);
      setProgress(Math.min(Math.max(scrollPercentage, 0), 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
};

/**
 * Smooth scroll to element
 * 
 * @param {string} elementId - ID of element to scroll to
 * @param {number} offset - Offset from top (default: 0)
 */
export const smoothScrollTo = (elementId, offset = 0) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  
  window.scrollTo({
    top,
    behavior: 'smooth'
  });
};

/**
 * Format number with commas
 * 
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Animate number counting up
 * 
 * @param {number} end - Target number
 * @param {number} duration - Animation duration in ms
 * @param {function} callback - Callback with current value
 */
export const animateCount = (end, duration, callback) => {
  const start = 0;
  const startTime = performance.now();

  const updateCount = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * easeOut);
    
    callback(current);

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      callback(end); // Ensure we hit the target
    }
  };

  requestAnimationFrame(updateCount);
};

/**
 * Detect if user prefers reduced motion
 * 
 * @returns {boolean} - True if reduced motion preferred
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get responsive value based on screen size
 * 
 * @param {object} values - { mobile, tablet, desktop }
 * @returns {*} - Value for current screen size
 */
export const getResponsiveValue = (values) => {
  const width = window.innerWidth;
  
  if (width < 640) return values.mobile;
  if (width < 1024) return values.tablet || values.mobile;
  return values.desktop || values.tablet || values.mobile;
};
