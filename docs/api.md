# API Reference

## Return Data Structure

`parseSlicerFile` returns an object with three top-level fields: `slicer`, `file`, and optionally `threeMf`.

### Slicer Metadata (`slicer`)

| Field | Type | Description |
|-------|------|-------------|
| `slicerName` | `string` | Name of the slicer software |
| `slicerVersion` | `string` | Version of the slicer |
| `sliceDate` | `string` | Date when file was sliced |
| `sliceTime` | `string` | Time when file was sliced |
| `printEta` | `string \| null` | Estimated print time |
| `slicer` | `SlicerType` | Enum identifying slicer type |

### File Metadata (`file`)

| Field | Type | Description |
|-------|------|-------------|
| `thumbnail` | `string \| null` | Base64 encoded thumbnail image |
| `filamentUsedMM` | `number` | Total filament used in millimeters |
| `filamentUsedG` | `number` | Total filament used in grams |
| `filamentType` | `string` | Primary filament material type |
| `printerModel` | `string` | Target printer model |
| `sliceSoft` | `SlicerType` | Slicer type enum |
| `filaments` | `FilamentInfo[]` | Array of detailed filament info |

### 3MF Specific Data (`threeMf`)

Present only when parsing `.3mf` files.

| Field | Type | Description |
|-------|------|-------------|
| `printerModelId` | `string` | Printer model identifier |
| `supportUsed` | `boolean` | Whether support structures are used |
| `fileNames` | `string[]` | Array of model file names in archive |
| `filaments` | `FilamentInfo[]` | Detailed per-filament information |
| `plateImage` | `string \| null` | Base64 encoded plate preview image |

## Available Parsers

| Parser | File Types | Notes |
|--------|-----------|-------|
| `GCodeParser` | `.gcode`, `.g` | Universal G-Code parser with auto-detection |
| `FlashPrintParser` | `.gcode` | FlashPrint-specific G-Code files |
| `OrcaFlashForgeParser` | `.gcode` | Orca Slicer / Orca-FlashForge files |
| `GXParser` | `.gx` | FlashForge binary format files |
| `ThreeMfParser` | `.3mf` | 3MF archive files (optimized for Orca Slicer) |
