# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a privacy-focused, client-side watermark tool for adding watermarks to ID card/document images. All image processing happens locally in the browser using Canvas API - no images are uploaded to any server.

**Key Features:**

- Single watermark and tiling modes
- HEIC/HEIF format support (auto-converts to JPEG)
- Multiple export formats (PNG/JPEG/WebP)
- Real-time preview with original/watermarked toggle
- Responsive design for desktop and mobile
- 300ms debounce optimization for smooth parameter adjustments

## Development Commands

### Package Manager

This project uses **pnpm** (not npm). All commands should use pnpm.

### Common Commands

```bash
# Install dependencies
pnpm install

# Start development server (runs on http://localhost:5173)
pnpm run dev

# Build for production
pnpm run build

# Preview production build locally
pnpm run preview

# Type check
pnpm exec tsc
```

## Architecture

### Core Components

**App.tsx** (main component)

- Contains all watermark configuration state and UI logic
- Manages file upload, image processing, and preview modes
- Implements debounced watermark regeneration (300ms) to optimize performance
- Handles both single and tile watermark modes with different UI controls

**utils/watermark.ts** (core image processing)

- `addWatermark()`: Canvas-based watermark rendering with rotation, spacing, and offset support
- `loadImage()`: File loading with HEIC format detection and conversion (uses dynamic import for heic2any to reduce bundle size)
- `downloadImage()`: Triggers browser download of processed images
- Supports PNG/JPEG/WebP export with quality control

**components/ImageViewer.tsx** (image preview modal)

- Professional image viewer with zoom and pan capabilities
- Opened when clicking preview images in the main UI

### State Management

All state is managed with React useState hooks in App.tsx:

- `watermarkOptions`: WatermarkOptions object containing all watermark parameters (text, fontSize, color, opacity, position, rotation, mode, spacing, offsetX, offsetY)
- `originalImage`: HTMLImageElement of uploaded file
- `previewUrl`: URL for original image preview
- `watermarkedUrl`: Data URL of watermarked image
- `showWatermark`: Boolean toggle for preview mode (original vs watermarked)
- `exportFormat`: Selected export format (png/jpeg/webp)
- `exportQuality`: Export quality for JPEG/WebP (50-100)

### Image Processing Flow

1. **Upload**: User selects file → `handleFileChange()` validates and detects format
2. **HEIC Handling**: If HEIC/HEIF, dynamically imports heic2any and converts to JPEG
3. **Loading**: `loadImage()` creates HTMLImageElement from file/converted blob
4. **Watermarking**: On param change → debounced call to `addWatermark()` with Canvas API
5. **Preview**: PNG format with quality 1.0 for instant display
6. **Export**: Uses user-selected format and quality settings

### Watermark Modes

**Single Mode**:

- 5 position presets (center, top-left, top-right, bottom-left, bottom-right)
- Supports rotation and offset adjustments
- Position dropdown only visible in single mode

**Tile Mode**:

- Calculates rotated bounding box to prevent overlap
- `spacing` parameter: 0-300% relative to watermark width
- `offsetX`/`offsetY`: -50% to +50% canvas shift for alignment
- Automatically calculates rows/columns to cover entire canvas
- Spacing control only visible in tile mode

### Performance Optimizations

1. **Dynamic Import**: heic2any library loaded only when HEIC file detected (reduces main bundle from 1.5MB to 167KB)
2. **Debouncing**: 300ms debounce on watermark regeneration prevents excessive Canvas redraws during slider adjustments
3. **Lazy Preview**: Preview uses PNG format; export uses user-selected format/quality

## Deployment

### GitHub Pages

The project uses GitHub Actions for automatic deployment:

- Workflow: `.github/workflows/deploy.yml`
- Triggers on push to `main` branch
- Uses pnpm with store caching
- Requires `BASE_PATH` repository variable (e.g., `/watermark-tool/`) if deployed to project pages

**vite.config.ts** reads `BASE_PATH` environment variable:

```typescript
base: command === 'build' ? process.env.BASE_PATH || '/' : '/'
```

For local builds with custom base path:

```bash
BASE_PATH=/your-repo-name/ pnpm run build
```

## Important Technical Notes

### HEIC Conversion

- Dynamic import pattern: `const heic2any = (await import('heic2any')).default`
- Conversion happens in `loadImage()` before image element creation
- Falls back to JPEG at 95% quality
- Error handling with user-friendly messages

### Canvas Watermarking

- Text metrics calculated once per watermark generation
- Rotation happens around watermark center point using ctx.translate/rotate
- Tile mode uses nested loops with calculated cell dimensions
- Single mode applies rotation around text center with save/restore

### Preview Toggle

- Uses same watermarked image, toggles between `previewUrl` and `watermarkedUrl`
- Download button disabled in original preview mode
- Export settings only visible in watermark mode

### TypeScript Types

- `WatermarkOptions`: All watermark parameters with specific literal types for position/mode
- `ImageFormat`: Literal union 'png' | 'jpeg' | 'webp'
- `ExportOptions`: Format and optional quality (0-1 range)

## File Structure

```
src/
├── App.tsx                    # Main app component with all UI and state
├── main.tsx                   # React entry point
├── index.css                  # Global styles (Tailwind)
├── utils/
│   └── watermark.ts           # Core image processing utilities
└── components/
    └── ImageViewer.tsx        # Image preview modal component
```

## Common Development Scenarios

### Adding New Watermark Parameters

1. Add property to `WatermarkOptions` interface in utils/watermark.ts
2. Add state to default `watermarkOptions` in App.tsx
3. Add UI control in watermark configuration section
4. Update `addWatermark()` Canvas logic to use the new parameter

### Adding New Export Format

1. Add format to `ImageFormat` type in utils/watermark.ts
2. Add case in `addWatermark()` switch statement for MIME type
3. Add radio button in export format section of App.tsx

### Modifying Watermark Rendering

- Edit the Canvas drawing logic in `addWatermark()` function
- Tile mode: lines 47-96 (nested loop with rotation)
- Single mode: lines 97-144 (positioned text with rotation)
