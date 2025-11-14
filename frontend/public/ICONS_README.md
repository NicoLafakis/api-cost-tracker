# PWA Icons

## Current Status

An SVG icon template (`icon.svg`) has been created. This needs to be converted to PNG files for PWA support.

## Required Icons

The following icon sizes are needed for full PWA support:

- `icon-192x192.png` - For Android and general PWA use
- `icon-512x512.png` - For Android splash screens
- `favicon.ico` - For browser tabs (32x32 or 16x16)
- `apple-touch-icon.png` - For iOS home screen (180x180)

## How to Generate Icons

### Option 1: Using an online tool
1. Visit https://realfavicongenerator.net/
2. Upload the `icon.svg` file
3. Download the generated icon pack
4. Place the files in this directory

### Option 2: Using ImageMagick (if installed)
```bash
# Install ImageMagick
sudo apt-get install imagemagick  # Ubuntu/Debian
brew install imagemagick          # macOS

# Convert SVG to PNGs
convert -background none icon.svg -resize 192x192 icon-192x192.png
convert -background none icon.svg -resize 512x512 icon-512x512.png
convert -background none icon.svg -resize 180x180 apple-touch-icon.png
convert -background none icon.svg -resize 32x32 favicon.ico
```

### Option 3: Using Node.js sharp library
```bash
npm install -g sharp-cli
sharp -i icon.svg -o icon-192x192.png resize 192 192
sharp -i icon.svg -o icon-512x512.png resize 512 512
sharp -i icon.svg -o apple-touch-icon.png resize 180 180
```

### Option 4: Manual design
Create custom PNG icons using design tools like:
- Figma
- Adobe Illustrator
- Canva
- Inkscape

## Verification

After generating the icons, verify they are referenced correctly in:
- `/frontend/index.html` - for favicon and apple-touch-icon
- `/frontend/public/manifest.json` - for PWA icons
- `/frontend/vite.config.ts` - for Vite PWA plugin configuration
