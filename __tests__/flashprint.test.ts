import { describe, it, expect, beforeAll } from 'vitest';
import { parseSlicerFile, SlicerType } from '../src';
import {
  gcodeFilePath,
  convertedGxFilePath,
  flashPrintGxFilePath,
} from './test-utils';

describe('Slicer File Parser', () => {
  describe('FlashPrint G-Code Parsing (test.gcode)', () => {
    let gcodeResult: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      gcodeResult = await parseSlicerFile(gcodeFilePath);
    });

    it('should parse the file without error', () => {
      expect(gcodeResult).toBeDefined();
    });

    it('should work with parseSlicerFile', () => {
      expect(gcodeResult).toHaveProperty('slicer');
      expect(gcodeResult).toHaveProperty('file');
      expect(gcodeResult).toHaveProperty('threeMf');
      expect(gcodeResult.threeMf).toBeNull();
      expect(gcodeResult.slicer).toBeDefined();
      expect(gcodeResult.file).toBeDefined();
    });

    it('should parse slicer metadata', () => {
      const slicer = gcodeResult.slicer;
      expect(slicer).toBeDefined();

      // values from test.gcode
      expect(slicer?.slicer).toBe(SlicerType.FlashPrint);
      expect(slicer?.slicerName).toEqual('ffslicer');
      expect(slicer?.slicerVersion).toEqual('2.4.4');
      expect(slicer?.sliceDate).toEqual('05/04/25');
      expect(slicer?.sliceTime).toEqual('5:52 PM');

      if (slicer?.slicer === SlicerType.OrcaFF) {
        expect(slicer?.printEta).toEqual('37m30s');
      } else if (slicer?.slicer === SlicerType.FlashPrint) {
        expect(slicer?.printEta).toBeNull();
      } else {
        expect(slicer?.printEta === null || typeof slicer?.printEta === 'string').toBe(true);
      }
    });

    it('should parse file metadata', () => {
      const file = gcodeResult.file;
      expect(file).toBeDefined();

      expect(file?.sliceSoft).not.toBe(SlicerType.Unknown);
      expect(file?.printerModel).toEqual('Adventurer 5M Pro');
      expect(file?.filamentType).toEqual('PLA');
      // flashprint doesn't report this information
      expect(file?.filamentUsedMM).toEqual(0);
      expect(file?.filamentUsedG).toEqual(0);
    });
  });

  describe('FlashPrint Converted GX Parsing (converted.gx)', () => {
    let gxResult: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      gxResult = await parseSlicerFile(convertedGxFilePath);
    });

    it('should parse the file without error', () => {
      expect(gxResult).toBeDefined();
    });

    it('should work with parseSlicerFile', () => {
      expect(gxResult).toHaveProperty('slicer');
      expect(gxResult).toHaveProperty('file');
      expect(gxResult).toHaveProperty('threeMf');
      expect(gxResult.threeMf).toBeNull();
      expect(gxResult.slicer).toBeDefined();
      expect(gxResult.file).toBeDefined();
    });

    it('should parse slicer metadata', () => {
      const slicer = gxResult.slicer;
      expect(slicer).toBeDefined();

      expect(slicer?.slicer).toBe(SlicerType.LegacyGX);
      expect(slicer?.slicerName).toEqual('OrcaSlicer');
      expect(slicer?.slicerVersion).toEqual('2.3.1-dev');
      expect(slicer?.sliceDate).toEqual('2025-05-12');
      expect(slicer?.sliceTime).not.toEqual('Error');
      expect(slicer?.printEta).toEqual('3h25m34s');
    });

    it('should parse file metadata', () => {
      const file = gxResult.file;
      expect(file).toBeDefined();

      expect(file?.sliceSoft).toBe(SlicerType.LegacyGX);
      expect(file?.filamentType).toEqual('PLA');
      expect(file?.filamentUsedMM).toEqual(13440.11);
      expect(file?.filamentUsedG).toEqual(40.09);
      expect(file?.printerModel).toEqual('Flashforge Adventurer 4 Series');

      // Check thumbnail extraction
      expect(file?.thumbnail).toBeDefined();
      expect(file?.thumbnail).toEqual(expect.stringContaining('data:image/png;base64,'));
    });
  });

  describe('Standard FlashPrint GX Parsing (FlashPrint.gx)', () => {
    let flashprintGxResult: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      flashprintGxResult = await parseSlicerFile(flashPrintGxFilePath);
    });

    it('should parse the file without error', () => {
      expect(flashprintGxResult).toBeDefined();
    });

    it('should work with parseSlicerFile', () => {
      expect(flashprintGxResult).toHaveProperty('slicer');
      expect(flashprintGxResult).toHaveProperty('file');
      expect(flashprintGxResult).toHaveProperty('threeMf');
      expect(flashprintGxResult.threeMf).toBeNull();
      expect(flashprintGxResult.slicer).toBeDefined();
      expect(flashprintGxResult.file).toBeDefined();
    });

    it('should parse slicer metadata', () => {
      const slicer = flashprintGxResult.slicer;
      expect(slicer).toBeDefined();

      // Test for values from the generator line in the FlashPrint GX format
      expect(slicer?.slicer).toBe(SlicerType.LegacyGX);
      expect(slicer?.slicerName).toEqual('ffslicer');
      expect(slicer?.slicerVersion).toEqual('2.4.4');
      expect(slicer?.sliceDate).toEqual('05/13/25');
      expect(slicer?.sliceTime).not.toEqual('Error');
    });

    it('should parse file metadata', () => {
      const file = flashprintGxResult.file;
      expect(file).toBeDefined();

      // Only test for values we know are available from the file
      expect(file?.sliceSoft).toBe(SlicerType.LegacyGX);
      expect(file?.filamentType).toEqual('PLA');
      expect(file?.printerModel).toEqual('Adventurer 4 Series');

      // Check thumbnail extraction
      expect(file?.thumbnail).toBeDefined();
      expect(file?.thumbnail).toEqual(expect.stringContaining('data:image/png;base64,'));
    });
  });
});
