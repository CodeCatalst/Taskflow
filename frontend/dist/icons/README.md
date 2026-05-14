# PWA Icons Setup

## Icon Generation Instructions

Since I cannot generate actual PNG images, please follow these steps to create your PWA icons:

### Option 1: Use PWA Asset Generator (Recommended)
```bash
npx @vite-pwa/assets-generator --preset minimal public/logo.png
```

### Option 2: Manual Creation
Use an online tool like:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/
- https://favicon.io/

### Required Sizes:
- 72x72 → icon-72x72.png
- 96x96 → icon-96x96.png
- 128x128 → icon-128x128.png
- 144x144 → icon-144x144.png
- 152x152 → icon-152x152.png
- 192x192 → icon-192x192.png
- 384x384 → icon-384x384.png
- 512x512 → icon-512x512.png (also use for maskable)

### Quick Steps:
1. Take your `public/logo.png` file
2. Upload to https://www.pwabuilder.com/imageGenerator
3. Download all generated icons
4. Place them in `public/icons/` folder
5. The manifest.json is already configured!

### Alternative: Use your existing logo
Copy your logo.png to all required sizes using any image editor or online tool.

**Note**: The manifest.json in public/ is already configured with all icon references.
