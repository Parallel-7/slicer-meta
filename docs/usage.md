# Usage Examples

## Parsing G-Code Files

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
```

## Parsing 3MF Archives

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
```

## Parsing GX Binary Files

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
```

## Working with Multiple Filaments

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
```
