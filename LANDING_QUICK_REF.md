# TaskFlow Landing Page - Quick Reference

## 🚀 Quick Start

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev

# Visit landing page
# http://localhost:3000/
```

---

## 📂 File Locations

| Component | Path |
|-----------|------|
| **Main Page** | `src/pages/Landing.jsx` |
| **Hero** | `src/components/landing/HeroSection.jsx` |
| **Trust** | `src/components/landing/TrustArchitecture.jsx` |
| **Product** | `src/components/landing/ProductExperience.jsx` |
| **Pricing** | `src/components/landing/PricingComparison.jsx` |
| **Philosophy** | `src/components/landing/Philosophy.jsx` |
| **Footer** | `src/components/landing/ConversionFooter.jsx` |
| **Navigation** | `src/components/landing/LandingNav.jsx` |
| **Utilities** | `src/utils/landingUtils.js` |
| **Styles** | `src/index.css` |
| **Config** | `tailwind.config.js` |

---

## 🎨 Quick Edits

### Change Hero Headline
`src/components/landing/HeroSection.jsx` (line ~66)
```jsx
<h1>
  <span>The Operating System</span>
  <span>For Team Momentum</span>
</h1>
```

### Update Pricing
`src/components/landing/PricingComparison.jsx` (line ~80+)
```jsx
<span className="text-5xl font-bold">$0</span>  // Community price
<span className="text-5xl font-bold">Custom</span>  // CORE price
```

### Modify CTAs
Search for:
- `"Create Free Community Workspace"` (Primary CTA)
- `"Explore Enterprise Capabilities"` (Secondary CTA)
- `"Contact Sales"` (CORE tier CTA)

### Change Colors
`tailwind.config.js`
```javascript
// Current: purple/violet gradient
// To change: Replace purple/violet with your brand colors
```

---

## 🎭 Animation Classes

### Fade In
```jsx
className="animate-fade-in"
```

### Fade In Up
```jsx
className="animate-fade-in-up"
```

### Slide In Left
```jsx
className="animate-slide-in-left"
```

### Float
```jsx
className="animate-float"
```

### With Delay
```jsx
className="animate-fade-in-up animation-delay-200"
```

Delays: `100`, `200`, `300`, `400` (ms)

---

## 🔧 Common Customizations

### Add New Section

1. Create component in `src/components/landing/`
2. Import in `Landing.jsx`
3. Add between existing sections

```jsx
// Landing.jsx
import NewSection from '../components/landing/NewSection';

<main>
  <HeroSection />
  <NewSection />  {/* Add here */}
  <TrustArchitecture />
</main>
```

### Change Section Order

Edit `Landing.jsx`:
```jsx
<main>
  <HeroSection />
  {/* Swap order */}
  <PricingComparison />  
  <TrustArchitecture />
  <ProductExperience />
</main>
```

### Remove Section

Comment out or delete from `Landing.jsx`:
```jsx
{/* <Philosophy /> */}
```

---

## 📱 Responsive Breakpoints

| Size | Breakpoint | Tailwind Prefix |
|------|-----------|-----------------|
| Mobile | < 640px | (default) |
| Small | 640px+ | `sm:` |
| Medium | 768px+ | `md:` |
| Large | 1024px+ | `lg:` |
| XL | 1280px+ | `xl:` |

Example:
```jsx
className="text-4xl sm:text-5xl lg:text-7xl"
// 4xl on mobile, 5xl on tablet, 7xl on desktop
```

---

## 🎯 CTA Routes

| CTA | Routes To |
|-----|-----------|
| Create Free Workspace | `/register` |
| Get Started | `/register` |
| Sign In | `/login` |
| Explore Pricing | Smooth scroll to `#pricing` |
| Contact Sales | Smooth scroll to `#contact` |

Update in respective component files.

---

## 🐛 Quick Fixes

### Animations Not Working
```bash
# Rebuild Tailwind
npm run dev
```

### Scroll Not Smooth
Check `index.css`:
```css
html {
  scroll-behavior: smooth;
}
```

### Noise Texture Missing
Check `index.css` has `.bg-noise` class.

### Navigation Not Revealing
Check `Landing.jsx` scrollY state is updating.

---

## 🎨 Design Tokens

### Colors (Tailwind)
```jsx
// Primary gradient
from-purple-500 to-violet-600

// Glass backgrounds
bg-white/5
bg-white/10

// Glass borders
border-white/10
border-white/20

// Dark backgrounds
bg-slate-950
bg-slate-900
```

### Spacing
```jsx
// Section padding
py-32          // Vertical
px-6 sm:px-8  // Horizontal

// Content width
max-w-7xl mx-auto
```

### Typography
```jsx
// Headlines
text-4xl sm:text-5xl lg:text-7xl
font-bold

// Body
text-lg sm:text-xl
text-slate-400

// Details
text-sm
text-slate-500
```

---

## 🚀 Performance Tips

### Optimize Images
- Use SVG for icons (already done)
- No raster images (recommended)
- If adding photos: WebP format, lazy load

### Reduce JavaScript
- Keep Intersection Observer
- Avoid heavy libraries
- CSS animations only

### Test Performance
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Test with Lighthouse
# Chrome DevTools → Lighthouse → Run audit
```

---

## 📊 Analytics Setup

### Add Google Analytics

`index.html`:
```html
<head>
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  </script>
</head>
```

### Track CTA Clicks

Add to button onClick:
```jsx
onClick={() => {
  // Track event
  gtag('event', 'cta_click', {
    'event_category': 'engagement',
    'event_label': 'hero_cta'
  });
  
  // Navigate
  navigate('/register');
}}
```

---

## 🔒 Security Checklist

- [ ] No API keys in code
- [ ] No sensitive data exposed
- [ ] HTTPS in production
- [ ] CSP headers configured
- [ ] CORS properly set
- [ ] Rate limiting on backend

---

## 🌐 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Netlify
```bash
# Build command
npm run build

# Publish directory
dist

# Redirects (_redirects file)
/*    /index.html   200
```

### Custom Server
```bash
# Build
npm run build

# Serve dist/ folder with nginx/apache
# Configure SPA routing (all routes → index.html)
```

---

## 📖 Additional Resources

- [Full Implementation Guide](./LANDING_PAGE_GUIDE.md)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

## 💬 Support

Questions? Issues?
- Check console for errors
- Verify all imports are correct
- Ensure routes are defined in App.jsx
- Test in different browsers

---

**Last Updated:** December 30, 2025
