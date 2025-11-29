# PWA Setup Instructions

## Icon Generation Required

Before building the PWA, you need to create the following icon files in the `public/` directory:

1. **icon-192x192.png** - 192x192 pixels
2. **icon-512x512.png** - 512x512 pixels  
3. **apple-touch-icon.png** - 180x180 pixels (for iOS)

### How to Generate Icons

You can use the existing `murshid-logo.png` as a base:

1. **Option 1: Online Tools**
   - Use [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - Or use [RealFaviconGenerator](https://realfavicongenerator.net/)

2. **Option 2: Image Editor**
   - Open `murshid-logo.png` in an image editor
   - Resize to the required dimensions
   - Save as PNG with the correct filenames

3. **Option 3: Command Line (if you have ImageMagick)**
   ```bash
   convert murshid-logo.png -resize 192x192 icon-192x192.png
   convert murshid-logo.png -resize 512x512 icon-512x512.png
   convert murshid-logo.png -resize 180x180 apple-touch-icon.png
   ```

## Testing the PWA

1. **Build the production version:**
   ```bash
   npm run build
   ```

2. **Preview the build:**
   ```bash
   npm run preview
   ```

3. **Test PWA features:**
   - Open Chrome DevTools (F12)
   - Go to **Application** tab
   - Check **Manifest** section
   - Check **Service Workers** section
   - Run **Lighthouse** audit (PWA score should be 90+)

4. **Test installation:**
   - Look for install icon in address bar
   - Or use menu → "Install Murshid"
   - On mobile: "Add to Home Screen" prompt should appear

5. **Test offline mode:**
   - Open DevTools → Network tab
   - Enable "Offline" mode
   - Refresh page - should still load (cached content)

## Important Notes

- Service workers only work over HTTPS (or localhost)
- PWA features require a production build
- Icons must be present for PWA to be installable
- The install prompt component will show automatically when PWA is installable

## Current Status

✅ PWA plugin installed
✅ Manifest.json created
✅ Vite config updated
✅ HTML meta tags added
✅ Install prompt component created
⏳ Icons need to be generated (see above)

