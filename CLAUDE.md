# Repository Guidelines

This file provides project-specific guidance to AI coding agents working in this repository.

## Project

TypeScript library for parsing metadata from 3D printing slicer files. Supports G-code, GX binary (FlashForge), and 3MF archive formats across multiple slicers (FlashPrint, Orca-FlashForge, OrcaSlicer).

## Commands

```bash
npm install      # Install dependencies
npm run build    # Compile TypeScript to dist/
npm test         # Run Vitest tests
```

No dev server, lint, or format commands are configured.

## Architecture

- **Entry point**: `src/index.ts` exports public API including `parseSlicerFile()` convenience function
- **Parsers**: `src/parser/` contains implementations in `gcode/` and `threemf/` subdirectories
- **Compiled output**: `dist/index.js` and `dist/index.d.ts`

## Testing

- Test files: `__tests__/**/*.test.ts`
- Fixtures: `__tests__/fixtures/`
- Uses Vitest with Node environment

## Publishing

Published to GitHub Packages (not npmjs.com) under `@parallel-7` scope. Requires `.npmrc` configuration:
```
@parallel-7:registry=https://npm.pkg.github.com/
```

GitHub Packages authentication required for installation.

## Gotchas

- **GX files** (`.gx`) are FlashForge's binary format, not standard G-code text
- Use `parseSlicerFile()` for automatic format detection, or import individual parsers (GCodeParser, ThreeMfParser, etc.) for direct control
- TypeScript strict mode enabled, targeting ES2016/CommonJS
- No linting or formatting configuration exists in this repo
