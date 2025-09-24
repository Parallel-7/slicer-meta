# Slicer Meta Parser

A TypeScript library for parsing metadata from 3D printing slicer files. This library extracts key information from G-Code, GX, and 3MF files, such as slicer information, print settings, and filament usage.

## Features

- Parses metadata from various slicer file formats.
- Supports G-Code, GX, and 3MF files.
- Automatically detects the file type based on the extension.
- Provides a simple, unified interface for different file types.

## Installation

To install this package, you need to configure npm to use the GitHub Packages registry.

Add the following to a `.npmrc` file in your project's root directory:

```
@parallel-7:registry=https://npm.pkg.github.com/
```

Then, install the package as usual:

```bash
npm install @parallel-7/slicer-meta
```

You will need to authenticate with GitHub Packages to download private packages.

## Usage

The primary way to use the library is with the `parseSlicerFile` function, which automatically handles different file formats.

```typescript
import { parseSlicerFile } from '@parallel-7/slicer-meta';

async function main() {
  try {
    const filePath = 'path/to/your/file.gcode';
    const metadata = await parseSlicerFile(filePath);

    console.log('Slicer Info:', metadata.slicer);
    console.log('File Info:', metadata.file);

    if (metadata.threeMf) {
      console.log('3MF Specific Info:', metadata.threeMf);
    }
  } catch (error) {
    console.error('Failed to parse file:', error);
  }
}

main();
```

## Advanced Usage

For more specific use cases, you can use the individual parsers directly. This can be useful if you know the file type in advance or need more control over the parsing process.

The following parsers are available:

- `GCodeParser`
- `FlashPrintParser`
- `OrcaFlashForgeParser`
- `GXParser`
- `ThreeMfParser`

### Example

```typescript
import { GCodeParser } from '@parallel-7/slicer-meta';

async function parseGCode() {
  const parser = new GCodeParser();
  await parser.parse('path/to/your/file.gcode');

  console.log('Slicer Info:', parser.slicerInfo);
  console.log('File Info:', parser.fileInfo);
}

parseGCode();
```
