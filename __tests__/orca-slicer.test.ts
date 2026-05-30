import { describe, it, expect, beforeAll } from 'vitest';
import { parseSlicerFile, SlicerType } from '../src';
import { orcaGcodeFilePath, fixturesDir } from './test-utils';

describe('Slicer File Parser', () => {
  describe('Standard OrcaSlicer Parsing (orcaslicer_v2.3.0.gcode)', () => {
    let orcaGcodeResult: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      orcaGcodeResult = await parseSlicerFile(orcaGcodeFilePath);
    });

    it('should parse the file without error', () => {
      expect(orcaGcodeResult).toBeDefined();
    });

    it('should work with parseSlicerFile', () => {
      expect(orcaGcodeResult).toHaveProperty('slicer');
      expect(orcaGcodeResult).toHaveProperty('file');
      expect(orcaGcodeResult).toHaveProperty('threeMf');
      expect(orcaGcodeResult.threeMf).toBeNull();
      expect(orcaGcodeResult.slicer).toBeDefined();
      expect(orcaGcodeResult.file).toBeDefined();
    });

    it('should parse slicer metadata', () => {
      const slicer = orcaGcodeResult.slicer;
      expect(slicer).toBeDefined();

      // values from orcaslicer_v2.3.0.gcode
      expect(slicer?.slicer).toBe(SlicerType.OrcaFF);
      expect(slicer?.slicerName).toEqual('OrcaSlicer');
      expect(slicer?.slicerVersion).toBeDefined();
      expect(slicer?.sliceDate).toBeDefined();
      expect(slicer?.sliceTime).toBeDefined();
      expect(slicer?.printEta).toBeDefined();
    });

    it('should parse file metadata', () => {
      const file = orcaGcodeResult.file;
      expect(file).toBeDefined();

      expect(file?.sliceSoft).toBe(SlicerType.OrcaFF);
      expect(file?.printerModel).toBeDefined();
      expect(file?.filamentType).toBeDefined();
      expect(typeof file?.filamentUsedMM).toBe('number');
      expect(typeof file?.filamentUsedG).toBe('number');
    });

    it('should populate file.filaments array for .gcode files', () => {
      const file = orcaGcodeResult.file;
      expect(file).toBeDefined();
      expect(file?.filaments).toBeDefined();
      expect(Array.isArray(file?.filaments)).toBe(true);

      // Should have at least one filament
      if (file?.filaments && file.filaments.length > 0) {
        const firstFilament = file.filaments[0];
        expect(firstFilament).toHaveProperty('id');
        expect(firstFilament).toHaveProperty('type');
        expect(firstFilament).toHaveProperty('color');
        expect(firstFilament).toHaveProperty('usedM');
        expect(firstFilament).toHaveProperty('usedG');

        // Verify color is present for .gcode file
        expect(firstFilament.color).toBeDefined();
        expect(firstFilament.color).not.toBeNull();
        expect(firstFilament.color).toEqual('#C0C0C0');

        // Verify unit conversion: usedM should be in meters
        if (file.filamentUsedMM > 0) {
          const expectedMeters = (file.filamentUsedMM / 1000).toFixed(2);
          expect(firstFilament.usedM).toEqual(expectedMeters);
        }
      }
    });

    it('should filter file.filaments to only show used materials', () => {
      const file = orcaGcodeResult.file;

      // All filaments in the array should have non-zero usage
      file?.filaments?.forEach((filament) => {
        const usedM = parseFloat(filament.usedM || '0');
        const usedG = parseFloat(filament.usedG || '0');
        expect(usedM > 0 || usedG > 0).toBe(true);
      });
    });

    it('should detect and extract thumbnail', () => {
      const file = orcaGcodeResult.file;
      expect(file).toBeDefined();
      // Thumbnail might or might not be present, but if it exists it should be a data URI
      if (file?.thumbnail) {
        expect(file.thumbnail).toEqual(
          expect.stringContaining('data:image/png;base64,')
        );
      }
    });
  });

  describe('OrcaSlicer Two Colors One Used (.gcode)', () => {
    const orcaTwoColorsGcodePath = fixturesDir + '/orcaslicer_v2.3.1-beta_twocolors.gcode';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(orcaTwoColorsGcodePath);
    });

    it('should parse the file without error', () => {
      expect(result).toBeDefined();
    });

    it('should work with parseSlicerFile', () => {
      expect(result).toHaveProperty('slicer');
      expect(result).toHaveProperty('file');
      expect(result).toHaveProperty('threeMf');
      expect(result.threeMf).toBeNull();
      expect(result.slicer).toBeDefined();
      expect(result.file).toBeDefined();
    });

    it('should parse slicer metadata', () => {
      const slicer = result.slicer;
      expect(slicer).toBeDefined();
      expect(slicer?.slicer).toBe(SlicerType.OrcaFF);
      expect(slicer?.slicerName).toEqual('OrcaSlicer');
    });

    it('should parse file metadata', () => {
      const file = result.file;
      expect(file).toBeDefined();
      expect(file?.filamentType).toEqual('PLA');
      expect(file?.filamentUsedMM).toEqual(3812.45);
      expect(file?.filamentUsedG).toEqual(11.37);
    });

    it('should filter file.filaments to only show used materials (1 of 2 configured)', () => {
      const file = result.file;
      expect(file?.filaments).toBeDefined();
      expect(file?.filaments).toHaveLength(1);
    });

    it('should have correct filament properties', () => {
      const file = result.file;
      const firstFilament = file?.filaments?.[0];

      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      expect(firstFilament.type).toEqual('PLA');
      expect(firstFilament.color).toEqual('#C0C0C0');
      expect(firstFilament.usedM).toEqual('3.81');
      expect(firstFilament.usedG).toEqual('11.37');
    });

    it('should convert filament usage from mm to meters', () => {
      const file = result.file;
      const firstFilament = file?.filaments?.[0];

      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      const expectedMeters = (file?.filamentUsedMM! / 1000).toFixed(2);
      expect(firstFilament.usedM).toEqual(expectedMeters);
    });

    it('should detect and extract thumbnail', () => {
      const file = result.file;
      if (file?.thumbnail) {
        expect(file.thumbnail).toEqual(
          expect.stringContaining('data:image/png;base64,')
        );
      }
    });
  });

  describe('OrcaSlicer Two Colors One Used (.3mf)', () => {
    const orcaTwoColors3mfPath = fixturesDir + '/orcaslicer_v2.3.1-beta_twocolors.3mf';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(orcaTwoColors3mfPath);
    });

    it('should parse the file without error', () => {
      expect(result).toBeDefined();
    });

    it('should work with parseSlicerFile', () => {
      expect(result).toHaveProperty('slicer');
      expect(result).toHaveProperty('file');
      expect(result).toHaveProperty('threeMf');
      expect(result.threeMf).not.toBeNull();
    });

    it('should parse file metadata from embedded g-code', () => {
      const file = result.file;
      expect(file).toBeDefined();
      expect(file?.filamentType).toEqual('PLA');
      expect(file?.filamentUsedMM).toEqual(3812.45);
      expect(file?.filamentUsedG).toEqual(11.37);
    });

    it('should filter file.filaments to only show used materials (1 of 2 configured)', () => {
      const file = result.file;
      expect(file?.filaments).toBeDefined();
      expect(file?.filaments).toHaveLength(1);
    });

    it('should have correct file.filaments properties', () => {
      const file = result.file;
      const firstFilament = file?.filaments?.[0];

      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      expect(firstFilament.type).toEqual('PLA');
      expect(firstFilament.color).toEqual('#C0C0C0');
      expect(firstFilament.usedM).toEqual('3.81');
      expect(firstFilament.usedG).toEqual('11.37');
    });

    it('should parse the embedded thumbnail', () => {
      const threeMf = result.threeMf;
      expect(threeMf).toBeDefined();
      expect(threeMf?.plateImage).toEqual(
        expect.stringContaining('data:image/png;base64,')
      );
    });

    it('should filter threeMf.filaments to only show used materials', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.filaments).toBeDefined();
      expect(threeMf?.filaments).toHaveLength(1);
    });

    it('should have correct threeMf.filaments properties', () => {
      const threeMf = result.threeMf;
      const firstFilament = threeMf?.filaments?.[0];

      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      expect(firstFilament.type).toEqual('PLA');
      expect(firstFilament.color).toEqual('#C0C0C0');
      expect(firstFilament.usedM).toEqual('3.81');
      expect(firstFilament.usedG).toEqual('11.37');
    });

    it('should have consistent filament data between file and threeMf', () => {
      const file = result.file;
      const threeMf = result.threeMf;

      expect(file?.filaments?.length).toEqual(threeMf?.filaments?.length);

      const fileFilament = file?.filaments?.[0];
      const threeMfFilament = threeMf?.filaments?.[0];

      expect(fileFilament?.type).toEqual(threeMfFilament?.type);
      expect(fileFilament?.color).toEqual(threeMfFilament?.color);
      expect(fileFilament?.usedM).toEqual(threeMfFilament?.usedM);
      expect(fileFilament?.usedG).toEqual(threeMfFilament?.usedG);
    });
  });
});
