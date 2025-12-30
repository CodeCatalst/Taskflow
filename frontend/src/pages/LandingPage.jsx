import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useVelocity, useAnimationFrame } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils/cn";
import { Crown, Shield, Users, Eye, LayoutGrid, Calendar, BarChart3, PieChart, Zap, Lock, Key, Server, Smartphone, Tablet, Monitor, Menu, X, Moon, Sun, TrendingUp, Clock, CheckCircle2, XCircle, ArrowRight, Star, Quote } from "lucide-react";

// ============= NAVIGATION BAR =============
const NavigationBar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm"
          : "bg-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-2xl font-bold text-blue-600">TaskFlow</span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Features
            </a>
            <a href="#security" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Security
            </a>
            <a href="#pricing" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Pricing
            </a>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{
            height: isMobileMenuOpen ? "auto" : 0,
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4">
            <a
              href="#features"
              className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#security"
              className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Security
            </a>
            <a
              href="#pricing"
              className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <button
              onClick={() => {
                navigate("/login");
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                navigate("/login");
                setIsMobileMenuOpen(false);
              }}
              className="block w-full px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-center"
            >
              Get Started
            </button>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};


// ============= MAGNETIC BUTTON =============
const MagneticButton = ({
  children,
  className,
  variant = "primary",
  onClick,
}) => {
  const buttonRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useSpring(0, { stiffness: 300, damping: 20 });
  const y = useSpring(0, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distX = (e.clientX - centerX) * 0.3;
    const distY = (e.clientY - centerY) * 0.3;
    
    x.set(distX);
    y.set(distY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.button
      ref={buttonRef}
      className={cn(
        "relative px-8 py-4 text-lg font-medium rounded-full transition-colors duration-300 overflow-hidden",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "secondary" && "bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600",
        className
      )}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className="relative z-10"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
      
      <motion.div
        className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.2 : 0.8,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
};

// ============= GRAVITY HERO =============
const SHAPE_COUNT = 12;
const CENTER_X = 0.5;
const CENTER_Y = 0.5;
const GRAVITY_STRENGTH = 0.00015;
const MOUSE_REPEL_STRENGTH = 0.08;
const MOUSE_REPEL_RADIUS = 200;

const GravityHero = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const shapesRef = useRef([]);
  const [, forceUpdate] = useState(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const dimensions = useRef({ width: 0, height: 0 });
  const animationRef = useRef();
  const lastUpdateTime = useRef(Date.now());

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const collapseProgress = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const smoothCollapse = useSpring(collapseProgress, { stiffness: 100, damping: 30 });
  
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  // Initialize shapes once
  useEffect(() => {
    const initShapes = [];
    for (let i = 0; i < SHAPE_COUNT; i++) {
      const orbitRadius = 150 + Math.random() * 250;
      const angle = (i / SHAPE_COUNT) * Math.PI * 2;
      initShapes.push({
        id: i,
        x: CENTER_X + Math.cos(angle) * (orbitRadius / 1000),
        y: CENTER_Y + Math.sin(angle) * (orbitRadius / 1000),
        vx: Math.cos(angle + Math.PI / 2) * 0.001,
        vy: Math.sin(angle + Math.PI / 2) * 0.001,
        size: 30 + Math.random() * 60,
        type: ["sphere", "ring", "rect"][i % 3],
        orbitRadius,
        orbitSpeed: 0.0005 + Math.random() * 0.001,
        orbitOffset: angle,
        mass: 1 + Math.random() * 2,
      });
    }
    shapesRef.current = initShapes;
  }, []);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        dimensions.current = {
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        };
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, []);

  // Animation loop - runs independently
  useEffect(() => {
    if (shapesRef.current.length === 0 || dimensions.current.width === 0) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = Math.min((now - lastUpdateTime.current) / 16, 2); // Cap at 2x speed
      lastUpdateTime.current = now;

      const collapse = smoothCollapse.get();
      const { width, height } = dimensions.current;
      const mouse = mousePos.current;

      shapesRef.current = shapesRef.current.map((shape, index) => {
        let { x, y, vx, vy, orbitRadius, orbitSpeed, orbitOffset, mass } = shape;

        const time = now * orbitSpeed;
        const targetOrbitX = CENTER_X + Math.cos(time + orbitOffset) * (orbitRadius / width);
        const targetOrbitY = CENTER_Y + Math.sin(time + orbitOffset) * (orbitRadius / height);

        // Calculate distance to orbit target
        const orbitDx = targetOrbitX - x;
        const orbitDy = targetOrbitY - y;
        const orbitDist = Math.sqrt(orbitDx * orbitDx + orbitDy * orbitDy);

        // Strong orbit tendency - main force keeping shapes in orbit
        if (orbitDist > 0.001) {
          vx += (orbitDx / orbitDist) * 0.002 * deltaTime;
          vy += (orbitDy / orbitDist) * 0.002 * deltaTime;
        }

        // Gentle centripetal force only when far from center (prevents collapse)
        const dx = CENTER_X - x;
        const dy = CENTER_Y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const targetDist = orbitRadius / Math.max(width, height);
        
        // Only apply gravity if shape is too far from its orbit radius
        if (dist > targetDist * 1.5) {
          vx += (dx / dist) * GRAVITY_STRENGTH * 0.3 * deltaTime;
          vy += (dy / dist) * GRAVITY_STRENGTH * 0.3 * deltaTime;
        }

        // Mouse repulsion
        const shapeScreenX = x * width;
        const shapeScreenY = y * height;
        const mouseDx = shapeScreenX - mouse.x;
        const mouseDy = shapeScreenY - mouse.y;
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        
        if (mouseDist < MOUSE_REPEL_RADIUS && mouseDist > 0) {
          const repelForce = (1 - mouseDist / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_STRENGTH;
          vx += (mouseDx / mouseDist) * repelForce / width * deltaTime;
          vy += (mouseDy / mouseDist) * repelForce / height * deltaTime;
        }

        // Grid collapse on scroll
        if (collapse > 0) {
          const gridCols = 4;
          const gridRows = 3;
          const gridX = (index % gridCols) / gridCols + 0.125;
          const gridY = Math.floor(index / gridCols) / gridRows + 0.2;
          
          x = x + (gridX - x) * collapse * 0.1 * deltaTime;
          y = y + (gridY - y) * collapse * 0.1 * deltaTime;
          vx *= Math.pow(1 - collapse * 0.05, deltaTime);
          vy *= Math.pow(1 - collapse * 0.05, deltaTime);
        }

        // Update position
        x += vx * deltaTime;
        y += vy * deltaTime;
        vx *= Math.pow(0.98, deltaTime);
        vy *= Math.pow(0.98, deltaTime);

        // Boundaries
        x = Math.max(0.05, Math.min(0.95, x));
        y = Math.max(0.05, Math.min(0.95, y));

        return { ...shape, x, y, vx, vy };
      });

      // Force re-render every 3 frames for smooth animation
      if (Math.floor(now / 50) % 3 === 0) {
        forceUpdate(prev => prev + 1);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [smoothCollapse]);

  const renderShape = (shape) => {
    const blur = Math.max(0, (shape.orbitRadius - 200) / 100);
    const baseOpacity = 0.6 + (1 - shape.orbitRadius / 400) * 0.4;

    const style = {
      left: `${shape.x * 100}%`,
      top: `${shape.y * 100}%`,
      width: shape.size,
      height: shape.size,
      transform: 'translate(-50%, -50%)',
      filter: `blur(${blur}px)`,
      opacity: baseOpacity,
    };

    if (shape.type === "sphere") {
      return (
        <motion.div
          key={shape.id}
          className="absolute rounded-full bg-gradient-to-br from-blue-500/40 to-blue-600/10 border border-blue-500/20"
          style={style}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: shape.id * 0.05, duration: 0.5 }}
        />
      );
    }

    if (shape.type === "ring") {
      return (
        <motion.div
          key={shape.id}
          className="absolute rounded-full border-2 border-blue-500/30 bg-transparent"
          style={style}
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ delay: shape.id * 0.05, duration: 20, repeat: Infinity, ease: "linear" }}
        />
      );
    }

    return (
      <motion.div
        key={shape.id}
        className="absolute bg-gradient-to-br from-gray-400/40 to-gray-500/10 border border-gray-400/30"
        style={{ ...style, borderRadius: 8 }}
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: shape.id * 0.05, duration: 0.5 }}
      />
    );
  };

  return (
    <motion.section
      ref={containerRef}
      className="relative h-[150vh] overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{ opacity }}
    >
      <motion.div 
        className="sticky top-0 h-screen flex items-center justify-center"
        style={{ scale }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
        
        <div className="absolute inset-0">
          {shapesRef.current.map(renderShape)}
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-gray-900 dark:text-white mb-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Control is
            <span className="block text-blue-600 font-normal">inevitable.</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            TaskFlow brings order to chaos. Every project. Every team. In perfect sync.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <MagneticButton onClick={() => navigate('/login')}>Start Building</MagneticButton>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-gray-400 dark:border-gray-600 flex items-start justify-center p-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-1 h-2 bg-gray-500 dark:bg-gray-400 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

// ============= STATISTICS SECTION =============
const AnimatedCounter = ({ value, suffix = "", duration = 2 }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    
    const increment = value / (duration * 60);
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        setHasAnimated(true);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [value, duration, hasAnimated]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const StatisticsSection = () => {
  const [inView, setInView] = useState(false);

  const stats = [
    { label: "Active Users", value: 10000, suffix: "+", icon: Users },
    { label: "Tasks Completed", value: 500000, suffix: "+", icon: CheckCircle2 },
    { label: "Time Saved", value: 2000, suffix: " hrs", icon: Clock },
    { label: "Teams Growing", value: 98, suffix: "%", icon: TrendingUp },
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        onViewportEnter={() => setInView(true)}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600">
                  <stat.icon className="w-8 h-8" />
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {inView ? <AnimatedCounter value={stat.value} suffix={stat.suffix} /> : "0"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

// ============= COMPARISON SECTION =============
const ComparisonSection = () => {
  return (
    <section className="min-h-screen py-24 px-4 flex items-center bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto w-full">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-center mb-4 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Before and After
        </motion.h2>
        <motion.p
          className="text-xl text-gray-600 dark:text-gray-400 text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          See the difference TaskFlow makes
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Before */}
          <motion.div
            className="relative p-8 rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute -top-4 left-8">
              <span className="px-4 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                Before
              </span>
            </div>
            <div className="space-y-4 mt-4">
              {[
                "Scattered tasks across tools",
                "Missed deadlines",
                "Poor team visibility",
                "Manual status updates",
                "Lost information",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-500 dark:border-blue-600"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute -top-4 left-8">
              <span className="px-4 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                After
              </span>
            </div>
            <div className="space-y-4 mt-4">
              {[
                "Everything in one place",
                "Never miss a deadline",
                "Real-time team sync",
                "Automatic tracking",
                "Complete transparency",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============= TESTIMONIALS SECTION =============
const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechCorp",
    content: "TaskFlow transformed how our team collaborates. We've cut meeting time by 60% and increased productivity dramatically.",
    rating: 5,
  },
  {
    name: "Michael Roberts",
    role: "Engineering Lead",
    company: "DevStudio",
    content: "The workspace system is brilliant. Perfect for managing multiple clients and keeping everything organized.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Startup Founder",
    company: "InnovateLab",
    content: "Best project management tool we've used. The real-time sync and automation features save us hours every week.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 px-4 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-center mb-4 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Loved by teams worldwide
        </motion.h2>
        <motion.p
          className="text-xl text-blue-600 text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Don't just take our word for it
        </motion.p>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              className="relative p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-blue-500/20" />
              
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {testimonial.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============= INTERACTIVE DEMO SECTION =============
const InteractiveDemoSection = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Dashboard", "Tasks", "Analytics"];

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-center mb-4 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          See it in action
        </motion.h2>
        <motion.p
          className="text-xl text-gray-600 dark:text-gray-400 text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Experience the power of TaskFlow
        </motion.p>

        <div className="flex justify-center gap-4 mb-8">
          {tabs.map((tab, i) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={cn(
                "px-6 py-3 rounded-full font-medium transition-all",
                activeTab === i
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        <motion.div
          className="relative aspect-video rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          
          <div className="p-8 h-full">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              {activeTab === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="aspect-square rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 p-4"
                        whileHover={{ scale: 1.05, y: -5 }}
                      >
                        <div className="h-4 w-3/4 bg-blue-500/30 rounded mb-2" />
                        <div className="h-8 w-full bg-blue-500/40 rounded mb-2" />
                        <div className="h-3 w-1/2 bg-blue-500/20 rounded" />
                      </motion.div>
                    ))}
                  </div>
                  <div className="h-32 rounded-xl bg-gray-100 dark:bg-gray-700/30 p-4">
                    <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-600 rounded mb-3" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="p-4 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ x: 10, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                    >
                      <div className="w-6 h-6 rounded bg-blue-500/30" />
                      <div className="flex-1">
                        <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-600" />
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 2 && (
                <div className="h-full flex items-center justify-center">
                  <svg className="w-full h-64" viewBox="0 0 400 200">
                    {[40, 80, 60, 120, 90, 140, 110].map((height, i) => (
                      <motion.rect
                        key={i}
                        x={i * 55 + 20}
                        y={200 - height}
                        width="40"
                        height={height}
                        className="fill-blue-500/60"
                        initial={{ height: 0, y: 200 }}
                        animate={{ height, y: 200 - height }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                      />
                    ))}
                  </svg>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ============= CHAOS TO ORDER SECTION =============
const ChaosToOrderSection = () => {
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const gridProgress = useTransform(scrollYProgress, [0.2, 0.6], [0, 1]);

  const shapes = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    initialX: (Math.random() - 0.5) * 400,
    initialY: (Math.random() - 0.5) * 400,
    initialRotate: Math.random() * 360,
    gridX: (i % 3) * 120 - 120,
    gridY: Math.floor(i / 3) * 120 - 120,
  }));

  return (
    <section ref={ref} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900">
        <motion.div className="relative w-96 h-96">
          {shapes.map((shape) => {
            const x = useTransform(gridProgress, [0, 1], [shape.initialX, shape.gridX]);
            const y = useTransform(gridProgress, [0, 1], [shape.initialY, shape.gridY]);
            const rotate = useTransform(gridProgress, [0, 1], [shape.initialRotate, 0]);
            const borderRadius = useTransform(gridProgress, [0, 0.5, 1], ["50%", "25%", "8px"]);

            return (
              <motion.div
                key={shape.id}
                className="absolute w-24 h-24 bg-gradient-to-br from-blue-500/30 to-blue-600/10 border border-blue-500/20"
                style={{
                  x,
                  y,
                  rotate,
                  borderRadius,
                  left: "50%",
                  top: "50%",
                  marginLeft: -48,
                  marginTop: -48,
                }}
              />
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

// ============= WORKSPACES SECTION =============
const WorkspacesSection = () => {
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const leftX = useTransform(scrollYProgress, [0.1, 0.4], [-100, 0]);
  const rightX = useTransform(scrollYProgress, [0.1, 0.4], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

  return (
    <section ref={ref} id="features" className="min-h-screen py-24 px-4 flex items-center bg-white dark:bg-gray-900 scroll-mt-16">
      <div className="max-w-6xl mx-auto w-full">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-center mb-4 text-gray-900 dark:text-white"
          style={{ opacity }}
        >
          Your world. Your rules.
        </motion.h2>
        <motion.p
          className="text-xl text-blue-600 text-center mb-16"
          style={{ opacity }}
        >
          Or everyone's.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            className="relative p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden group"
            style={{ x: leftX, opacity }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <div className="relative">
              <span className="text-xs uppercase tracking-widest text-blue-600 mb-4 block">Core</span>
              <h3 className="text-2xl font-medium mb-3 text-gray-900 dark:text-white">Private Workspace</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your controlled environment. Full ownership, granular permissions, and complete privacy.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                {["Owner Control", "Role Management", "Private Data", "Custom Rules"].map((feature, i) => (
                  <motion.div
                    key={feature}
                    className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    {feature}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden group"
            style={{ x: rightX, opacity }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400/5 to-transparent" />
            <div className="relative">
              <span className="text-xs uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4 block">Community</span>
              <h3 className="text-2xl font-medium mb-3 text-gray-900 dark:text-white">Open Collaboration</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share ideas, collaborate publicly, and build together with the community.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                {["Public Boards", "Team Sharing", "Open Access", "Collaboration"].map((feature, i) => (
                  <motion.div
                    key={feature}
                    className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    {feature}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============= ROLES SECTION =============
const roles = [
  { icon: Crown, label: "Owner", desc: "Full control over workspace", depth: 0 },
  { icon: Shield, label: "Admin", desc: "Manage members and settings", depth: 1 },
  { icon: Users, label: "Member", desc: "Collaborate on projects", depth: 2 },
  { icon: Eye, label: "Guest", desc: "View-only access", depth: 3 },
];

const RolesSection = () => {
  return (
    <section className="min-h-screen py-24 px-4 flex items-center bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto w-full">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-center mb-4 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Power flows down.
        </motion.h2>
        <motion.p
          className="text-xl text-blue-600 text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Access flows up.
        </motion.p>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-blue-500/20 to-transparent -translate-x-1/2" />

          <div className="space-y-8">
            {roles.map((role, i) => (
              <motion.div
                key={role.label}
                className="relative"
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{
                  paddingLeft: i % 2 === 0 ? 0 : "50%",
                  paddingRight: i % 2 === 0 ? "50%" : 0,
                }}
              >
                <motion.div
                  className="relative p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                  style={{
                    marginLeft: i % 2 === 0 ? role.depth * 20 : 0,
                    marginRight: i % 2 !== 0 ? role.depth * 20 : 0,
                    filter: `blur(${role.depth * 0.3}px)`,
                    transform: `scale(${1 - role.depth * 0.03})`,
                  }}
                  whileHover={{ scale: 1.02, filter: "blur(0px)" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600">
                      <role.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{role.label}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{role.desc}</p>
                    </div>
                  </div>
                </motion.div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-600 border-2 border-white dark:border-gray-900" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ============= COLLABORATION SECTION =============
const colors = ["#3B82F6", "#60A5FA", "#2563EB", "#1D4ED8"];
const names = ["Alex", "Sam", "Jordan", "Taylor"];

const CollaborationSection = () => {
  const containerRef = useRef(null);
  const [cursors, setCursors] = useState([]);
  const [bounds, setBounds] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setBounds({ width: rect.width - 60, height: rect.height - 60 });
      }
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  useEffect(() => {
    const initialCursors = names.map((name, i) => ({
      id: i,
      x: 100 + Math.random() * Math.min(300, bounds.width - 200),
      y: 100 + Math.random() * Math.min(200, bounds.height - 200),
      color: colors[i],
      name,
    }));
    setCursors(initialCursors);

    const interval = setInterval(() => {
      setCursors((prev) =>
        prev.map((cursor) => {
          let newX = cursor.x + (Math.random() - 0.5) * 40;
          let newY = cursor.y + (Math.random() - 0.5) * 40;
          
          // Keep within bounds
          newX = Math.max(50, Math.min(bounds.width - 50, newX));
          newY = Math.max(50, Math.min(bounds.height - 50, newY));
          
          return {
            ...cursor,
            x: newX,
            y: newY,
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [bounds]);

  return (
    <section className="min-h-screen py-24 px-4 flex items-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto w-full">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-center mb-4 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Every change.
        </motion.h2>
        <motion.p
          className="text-xl text-gray-600 dark:text-gray-400 text-center mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Every team member.
        </motion.p>
        <motion.p
          className="text-2xl text-blue-600 text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          In sync.
        </motion.p>

        <motion.div
          ref={containerRef}
          className="relative aspect-video rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute inset-4 grid grid-cols-3 gap-4">
            {["To Do", "In Progress", "Done"].map((col, i) => (
              <div key={col} className="flex flex-col">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 px-2">{col}</div>
                <div className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-700/30 p-2 space-y-2">
                  {Array.from({ length: 3 - i }).map((_, j) => (
                    <motion.div
                      key={j}
                      className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                      animate={{
                        boxShadow:
                          i === 1 && j === 0
                            ? [
                                "0 0 0 0 rgba(59, 130, 246, 0)",
                                "0 0 0 4px rgba(59, 130, 246, 0.2)",
                                "0 0 0 0 rgba(59, 130, 246, 0)",
                              ]
                            : "none",
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="h-2 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
                      <div className="h-2 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {cursors.map((cursor) => (
            <motion.div
              key={cursor.id}
              className="absolute pointer-events-none"
              animate={{ x: cursor.x, y: cursor.y }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={cursor.color}
                className="drop-shadow-lg"
              >
                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.86a.5.5 0 0 0-.85.35Z" />
              </svg>
              <span
                className="absolute left-6 top-4 text-xs px-2 py-0.5 rounded whitespace-nowrap text-white"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============= TOOLKIT SECTION =============
const tools = [
  { icon: LayoutGrid, label: "Kanban Boards", color: "from-blue-500/30" },
  { icon: Calendar, label: "Calendar View", color: "from-gray-500/30" },
  { icon: BarChart3, label: "Dashboard", color: "from-blue-500/20" },
  { icon: PieChart, label: "Analytics", color: "from-gray-500/20" },
];

const ToolkitSection = () => {
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <section ref={ref} className="min-h-screen py-24 px-4 flex items-center bg-gray-50 dark:bg-gray-800">
      <div className="max-w-5xl mx-auto w-full">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-center mb-16 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          The Toolkit
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {tools.map((tool, i) => {
            const y = useTransform(
              scrollYProgress,
              [0.1, 0.4],
              [i % 2 === 0 ? 100 : -100, 0]
            );
            const opacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
            const rotate = useTransform(
              scrollYProgress,
              [0.1, 0.4],
              [i % 2 === 0 ? 15 : -15, 0]
            );

            return (
              <motion.div
                key={tool.label}
                className="relative aspect-square rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden group"
                style={{ y, opacity, rotate }}
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} to-transparent opacity-50`} />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <tool.icon className="w-12 h-12 text-blue-600 mb-4" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-center">{tool.label}</span>
                </div>
                
                <motion.div
                  className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ============= AUTOMATION SECTION =============
const nodes = [
  { id: 1, x: 20, y: 30, label: "Trigger" },
  { id: 2, x: 50, y: 20, label: "Process" },
  { id: 3, x: 80, y: 35, label: "Action" },
  { id: 4, x: 50, y: 60, label: "Notify" },
  { id: 5, x: 35, y: 75, label: "Log" },
  { id: 6, x: 65, y: 80, label: "Update" },
];

const connections = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 2, to: 4 },
  { from: 4, to: 5 },
  { from: 4, to: 6 },
];

const AutomationSection = () => {
  return (
    <section className="min-h-screen py-24 px-4 flex items-center bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-5xl mx-auto w-full">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-center mb-4 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Set the rules.
        </motion.h2>
        <motion.p
          className="text-xl text-blue-600 text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Let the system run.
        </motion.p>

        <motion.div
          className="relative aspect-[16/9] max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <svg className="absolute inset-0 w-full h-full">
            {connections.map((conn, i) => {
              const from = nodes.find((n) => n.id === conn.from);
              const to = nodes.find((n) => n.id === conn.to);
              return (
                <motion.line
                  key={i}
                  x1={`${from.x}%`}
                  y1={`${from.y}%`}
                  x2={`${to.x}%`}
                  y2={`${to.y}%`}
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeOpacity="0.3"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                />
              );
            })}
            
            {connections.map((conn, i) => {
              const from = nodes.find((n) => n.id === conn.from);
              const to = nodes.find((n) => n.id === conn.to);
              return (
                <motion.circle
                  key={`particle-${i}`}
                  r="4"
                  fill="#3B82F6"
                  initial={{ cx: `${from.x}%`, cy: `${from.y}%` }}
                  animate={{
                    cx: [`${from.x}%`, `${to.x}%`],
                    cy: [`${from.y}%`, `${to.y}%`],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
          </svg>

          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              className="absolute p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.1 }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{node.label}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============= SECURITY SECTION =============
const fragments = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i / 12) * 360,
  distance: 80 + (i % 3) * 20,
}));

const SecuritySection = () => {
  return (
    <section id="security" className="min-h-screen py-24 px-4 flex items-center bg-white dark:bg-gray-900 scroll-mt-16">
      <div className="max-w-5xl mx-auto w-full">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-center mb-4 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Built for the scrutiny
        </motion.h2>
        <motion.p
          className="text-xl text-blue-600 text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          of scale.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            className="relative aspect-square max-w-sm mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-full bg-blue-500/10 border border-blue-500/20"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              <Lock className="w-12 h-12 text-blue-600" />
            </motion.div>

            {fragments.map((fragment, i) => {
              const rad = (fragment.angle * Math.PI) / 180;
              const startX = Math.cos(rad) * fragment.distance * 2;
              const startY = Math.sin(rad) * fragment.distance * 2;
              const endX = Math.cos(rad) * fragment.distance;
              const endY = Math.sin(rad) * fragment.distance;

              return (
                <motion.div
                  key={fragment.id}
                  className="absolute left-1/2 top-1/2 w-4 h-4 rounded bg-blue-500/30"
                  style={{
                    marginLeft: -8,
                    marginTop: -8,
                  }}
                  initial={{
                    x: startX,
                    y: startY,
                    opacity: 0,
                    rotate: fragment.angle,
                  }}
                  whileInView={{
                    x: endX,
                    y: endY,
                    opacity: 1,
                    rotate: 0,
                  }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.3 + i * 0.05,
                    duration: 0.6,
                    type: "spring",
                  }}
                />
              );
            })}
          </motion.div>

          <div className="space-y-6">
            {[
              { icon: Shield, title: "Enterprise SSO", desc: "SAML, OAuth, and OIDC support" },
              { icon: Key, title: "Role-Based Access", desc: "Granular permission controls" },
              { icon: Server, title: "Data Residency", desc: "Choose your data location" },
              { icon: Lock, title: "End-to-End Encryption", desc: "Your data stays yours" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ============= PWA SECTION =============
const PWASection = () => {
  return (
    <section className="min-h-screen py-24 px-4 flex items-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto w-full">
        <motion.h2
          className="text-4xl md:text-6xl font-light text-center mb-4 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Install it. Own it.
        </motion.h2>
        <motion.p
          className="text-xl text-blue-600 text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Work anywhere.
        </motion.p>

        <div className="relative flex items-end justify-center gap-4 md:gap-8">
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-20 md:w-32 aspect-[9/19] rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="w-full h-full p-1 md:p-2">
                <div className="w-full h-full rounded-xl bg-gray-100 dark:bg-gray-700/30 p-1 md:p-2">
                  <motion.div
                    className="w-full h-8 md:h-12 rounded bg-blue-500/20 mb-1 md:mb-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="space-y-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-3 md:h-4 rounded bg-gray-300 dark:bg-gray-600" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Smartphone className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 text-gray-600 dark:text-gray-400" />
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className="w-48 md:w-80 aspect-[16/10] rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="w-full h-full p-2 md:p-4">
                <div className="w-full h-full rounded-lg bg-gray-100 dark:bg-gray-700/30 p-2 md:p-3">
                  <div className="flex gap-2 mb-2 md:mb-3">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="flex-1 h-16 md:h-24 rounded bg-gray-300 dark:bg-gray-600"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                      />
                    ))}
                  </div>
                  <div className="h-8 md:h-12 rounded bg-blue-500/20" />
                </div>
              </div>
            </div>
            <Monitor className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 text-gray-600 dark:text-gray-400" />
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-28 md:w-48 aspect-[4/3] rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="w-full h-full p-2 md:p-3">
                <div className="w-full h-full rounded-lg bg-gray-100 dark:bg-gray-700/30 p-1 md:p-2">
                  <motion.div
                    className="w-full h-6 md:h-8 rounded bg-blue-500/20 mb-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  <div className="grid grid-cols-2 gap-1 md:gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square rounded bg-gray-300 dark:bg-gray-600" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Tablet className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 text-gray-600 dark:text-gray-400" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============= FINAL CTA SECTION =============
const FinalCTASection = () => {
  const navigate = useNavigate();
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  const convergence = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const floatingElements = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    size: 20 + Math.random() * 40,
    startX: (Math.random() - 0.5) * 800,
    startY: (Math.random() - 0.5) * 600,
    type: ["sphere", "ring", "rect"][i % 3],
  }));

  return (
    <section
      ref={ref}
      id="pricing"
      className="min-h-screen py-24 px-4 flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-800 scroll-mt-16"
    >
      {floatingElements.map((el) => {
        const x = useTransform(convergence, [1, 0], [el.startX, 0]);
        const y = useTransform(convergence, [1, 0], [el.startY, 0]);
        const opacity = useTransform(convergence, [1, 0.5, 0], [0.6, 0.4, 0]);
        const scale = useTransform(convergence, [1, 0], [1, 0.5]);

        return (
          <motion.div
            key={el.id}
            className={`absolute left-1/2 top-1/2 ${
              el.type === "sphere"
                ? "rounded-full bg-blue-500/20"
                : el.type === "ring"
                ? "rounded-full border-2 border-blue-500/30 bg-transparent"
                : "rounded-lg bg-gray-400/20"
            }`}
            style={{
              width: el.size,
              height: el.size,
              x,
              y,
              opacity,
              scale,
              marginLeft: -el.size / 2,
              marginTop: -el.size / 2,
            }}
          />
        );
      })}

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.h2
          className="text-4xl md:text-6xl font-light mb-8 text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Ready to take control?
        </motion.h2>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <MagneticButton onClick={() => navigate('/login')}>Get Started</MagneticButton>
          <MagneticButton variant="secondary" onClick={() => navigate('/login')}>Sign In</MagneticButton>
        </motion.div>

        <motion.p
          className="mt-8 text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          Free to start. Scale as you grow.
        </motion.p>
      </div>
    </section>
  );
};

// ============= FOOTER =============
const Footer = () => {
  return (
    <footer className="py-16 px-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
          <motion.div
            className="text-2xl font-bold text-blue-600 mb-4 md:mb-0"
            whileHover={{ scale: 1.05 }}
          >
            TaskFlow
          </motion.div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 TaskFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// ============= MAIN PAGE =============
const LandingPage = () => {
  return (
    <main className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">
      <NavigationBar />
      <GravityHero />
      <StatisticsSection />
      <ChaosToOrderSection />
      <WorkspacesSection />
      <ComparisonSection />
      <RolesSection />
      <CollaborationSection />
      <TestimonialsSection />
      <ToolkitSection />
      <InteractiveDemoSection />
      <AutomationSection />
      <SecuritySection />
      <PWASection />
      <FinalCTASection />
      <Footer />
    </main>
  );
};

export default LandingPage;
