<div align="center">

# Slicer Meta Parser

A TypeScript library for parsing metadata from 3D printing slicer files

[![npm version](https://img.shields.io/badge/npm-1.1.0-blue.svg)](https://www.npmjs.com/package/@parallel-7/slicer-meta)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Private-red.svg)](https://github.com/Parallel-7/slicer-meta)

</div>

---

<div align="center">

## Supported File Formats

</div>

<div align="center">

| File Format | Extension | Description |
|------------|-----------|-------------|
| G-Code | `.gcode`, `.g` | Standard G-Code files from various slicers |
| GX Binary | `.gx` | FlashForge binary format with embedded thumbnails |
| 3MF Archive | `.3mf` | ZIP-based 3D manufacturing format with metadata |

</div>

<div align="center">

## Supported Slicers

</div>

<div align="center">

| Slicer | Detection | Metadata Support |
|--------|-----------|------------------|
| FlashPrint | Header-based | Full support for printer model, filament type, timestamps |
| Orca-FlashForge | Header-based | Advanced metadata including detailed filament tracking |
| OrcaSlicer | Header-based | Block-based metadata with Base64 thumbnails |
| Legacy GX | Format-based | Binary format with embedded G-Code parsing |

</div>

<div align="center">

## Feature Coverage

</div>

<div align="center">

| Feature | G-Code | GX Binary | 3MF Archive |
|---------|--------|-----------|-------------|
| Slicer Detection | Yes | Yes | Yes |
| Version & Timestamp | Yes | Yes | Yes |
| Print Time (ETA) | Yes | Yes | Yes |
| Filament Usage (mm/g) | Yes | Yes | Yes |
| Filament Type | Yes | Yes | Yes |
| Filament Color | No | No | Yes |
| Multiple Filaments | Limited | Limited | Yes |
| Printer Model | Yes | Yes | Yes |
| Thumbnail Extraction | Base64 | Binary | Base64 |
| Support Detection | No | No | Yes |
| Model File Names | No | No | Yes |
| Plate Images | No | No | Yes |

</div>

<div align="center">

## Parsing Capabilities

</div>

<div align="center">

| Capability | Description |
|------------|-------------|
| Auto-Detection | Automatically detects file type based on extension |
| Universal Interface | Single function handles all supported formats |
| Slicer Identification | Determines slicer type from file headers |
| Metadata Extraction | Parses comments and embedded metadata blocks |
| Thumbnail Processing | Extracts and decodes Base64 encoded images |
| Unit Conversion | Converts filament usage to meters automatically |
| Filtered Results | Shows only filaments actually used in print |
| Binary Parsing | Handles GX binary format with embedded G-Code |
| Archive Processing | Unzips and parses 3MF container structure |

</div>

---

<div align="center">

## Installation

</div>

Configure npm to use the GitHub Packages registry by adding the following to a `.npmrc` file in your project root:

```
@parallel-7:registry=https://npm.pkg.github.com/
```

Install the package:

```bash
npm install @parallel-7/slicer-meta
```

> You will need to authenticate with GitHub Packages to download private packages.

---

<div align="center">

## Basic Usage

</div>

The primary method for parsing slicer files is the `parseSlicerFile` function, which automatically handles all supported file formats:

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

---

<div align="center">

## Advanced Usage Examples

</div>

<div align="center">

### Parsing G-Code Files

</div>

```typescript
import { GCodeParser } from '@parallel-7/slicer-meta';

async function parseGCode() {
  const parser = new GCodeParser();
  await parser.parse('path/to/your/file.gcode');

  console.log('Slicer Info:', parser.slicerInfo);
  console.log('File Info:', parser.fileInfo);
  console.log('Print ETA:', parser.slicerInfo?.printEta);
  console.log('Filament Used:', parser.fileInfo?.filamentUsedMM, 'mm');
}

parseGCode();
```

<div align="center">

### Parsing 3MF Archives

</div>

```typescript
import { ThreeMfParser } from '@parallel-7/slicer-meta';

function parse3MF() {
  const parser = new ThreeMfParser();
  parser.parse('path/to/your/file.3mf');

  console.log('Printer Model:', parser.printerModelId);
  console.log('Support Used:', parser.supportUsed);
  console.log('Model Files:', parser.fileNames);
  console.log('Filaments:', parser.filaments);

  if (parser.plateImage) {
    console.log('Plate thumbnail available');
  }
}

parse3MF();
```

<div align="center">

### Parsing GX Binary Files

</div>

```typescript
import { GXParser } from '@parallel-7/slicer-meta';

async function parseGX() {
  const parser = new GXParser();
  await parser.parse('path/to/your/file.gx');

  console.log('Printer Model:', parser.fileInfo?.printerModel);
  console.log('Filament Type:', parser.fileInfo?.filamentType);

  if (parser.fileInfo?.thumbnail) {
    console.log('Thumbnail extracted from binary format');
  }
}

parseGX();
```

<div align="center">

### Working with Multiple Filaments

</div>

```typescript
import { parseSlicerFile } from '@parallel-7/slicer-meta';

async function analyzeFilaments() {
  const metadata = await parseSlicerFile('path/to/multi-filament.3mf');

  if (metadata.file?.filaments) {
    metadata.file.filaments.forEach((filament, index) => {
      console.log(`Filament ${index + 1}:`);
      console.log(`  Type: ${filament.type}`);
      console.log(`  Color: ${filament.color}`);
      console.log(`  Used: ${filament.usedM}m (${filament.usedG}g)`);
    });
  }
}

analyzeFilaments();
```

---

<div align="center">

## Available Parsers

</div>

<div align="center">

| Parser | File Types | Use Case |
|--------|-----------|----------|
| `GCodeParser` | `.gcode`, `.g` | Universal G-Code parser with auto-detection |
| `FlashPrintParser` | `.gcode` | FlashPrint-specific G-Code files |
| `OrcaFlashForgeParser` | `.gcode` | Orca Slicer / Orca-FlashForge files |
| `GXParser` | `.gx` | FlashForge binary format files |
| `ThreeMfParser` | `.3mf` | 3MF archive files (optimized for Orca Slicer) |

</div>

---

<div align="center">

## Return Data Structure

</div>

<div align="center">

### Slicer Metadata

</div>

<div align="center">

| Field | Type | Description |
|-------|------|-------------|
| `slicerName` | `string` | Name of the slicer software |
| `slicerVersion` | `string` | Version of the slicer |
| `sliceDate` | `string` | Date when file was sliced |
| `sliceTime` | `string` | Time when file was sliced |
| `printEta` | `string \| null` | Estimated print time |
| `slicer` | `SlicerType` | Enum identifying slicer type |

</div>

<div align="center">

### File Metadata

</div>

<div align="center">

| Field | Type | Description |
|-------|------|-------------|
| `thumbnail` | `string \| null` | Base64 encoded thumbnail image |
| `filamentUsedMM` | `number` | Total filament used in millimeters |
| `filamentUsedG` | `number` | Total filament used in grams |
| `filamentType` | `string` | Primary filament material type |
| `printerModel` | `string` | Target printer model |
| `sliceSoft` | `SlicerType` | Slicer type enum |
| `filaments` | `FilamentInfo[]` | Array of detailed filament info |

</div>

<div align="center">

### 3MF Specific Data

</div>

<div align="center">

| Field | Type | Description |
|-------|------|-------------|
| `printerModelId` | `string` | Printer model identifier |
| `supportUsed` | `boolean` | Whether support structures are used |
| `fileNames` | `string[]` | Array of model file names in archive |
| `filaments` | `FilamentInfo[]` | Detailed per-filament information |
| `plateImage` | `string \| null` | Base64 encoded plate preview image |

</div>

---
