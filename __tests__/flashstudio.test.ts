import { describe, it, expect, beforeAll } from 'vitest';
import { parseSlicerFile, SlicerType } from '../src';
import { fixturesDir } from './test-utils';

describe('Slicer File Parser', () => {
  describe('FlashStudio G-code Parsing (flashstudio_v1.7.6.gcode)', () => {
    const flashStudioGcodePath = fixturesDir + '/flashstudio_v1.7.6.gcode';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(flashStudioGcodePath);
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

    it('should detect FlashStudio as the slicer type', () => {
      const slicer = result.slicer;
      expect(slicer).toBeDefined();
      expect(slicer?.slicer).toBe(SlicerType.FlashStudio);
      expect(slicer?.slicerName).toEqual('Flash Studio');
      expect(slicer?.slicerVersion).toEqual('1.7.6');
    });

    it('should parse slicer date and time', () => {
      const slicer = result.slicer;
      expect(slicer?.sliceDate).toEqual('2026-05-30');
      expect(slicer?.sliceTime).toBeDefined();
      expect(slicer?.sliceTime).not.toEqual('Error');
    });

    it('should parse print ETA', () => {
      const slicer = result.slicer;
      expect(slicer?.printEta).toEqual('38m21s');
    });

    it('should parse file metadata', () => {
      const file = result.file;
      expect(file).toBeDefined();
      expect(file?.sliceSoft).toBe(SlicerType.FlashStudio);
      expect(file?.filamentType).toEqual('PLA');
      expect(file?.filamentUsedMM).toEqual(3747.81);
      expect(file?.filamentUsedG).toEqual(11.18);
    });

    it('should parse print settings (layer height, infill, layer count)', () => {
      const file = result.file;
      expect(file?.layerHeight).toEqual(0.2);
      expect(file?.infillDensity).toEqual(15);
      expect(file?.layerCount).toEqual(240);
    });

    it('should parse filaments array', () => {
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
      expect(firstFilament.color).toEqual('#26A69A');
      expect(firstFilament.usedM).toEqual('3.75');
      expect(firstFilament.usedG).toEqual('11.18');
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

  describe('FlashStudio 3MF Parsing (flashstudio_v1.7.6.3mf)', () => {
    const flashStudio3mfPath = fixturesDir + '/flashstudio_v1.7.6.3mf';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(flashStudio3mfPath);
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

    it('should detect FlashStudio from embedded g-code', () => {
      const slicer = result.slicer;
      expect(slicer).toBeDefined();
      expect(slicer?.slicer).toBe(SlicerType.FlashStudio);
      expect(slicer?.slicerName).toEqual('Flash Studio');
      expect(slicer?.slicerVersion).toEqual('1.7.6');
    });

    it('should parse file metadata from embedded g-code', () => {
      const file = result.file;
      expect(file).toBeDefined();
      expect(file?.sliceSoft).toBe(SlicerType.FlashStudio);
      expect(file?.filamentType).toEqual('PLA');
      expect(file?.filamentUsedMM).toEqual(3747.81);
      expect(file?.filamentUsedG).toEqual(11.18);
    });

    it('should parse print settings from embedded g-code (layer height, infill, layer count)', () => {
      const file = result.file;
      expect(file?.layerHeight).toEqual(0.2);
      expect(file?.infillDensity).toEqual(15);
      expect(file?.layerCount).toEqual(240);
    });

    it('should parse 3MF metadata', () => {
      const threeMf = result.threeMf;
      expect(threeMf).toBeDefined();
      expect(threeMf?.printerModelId).toEqual('Flashforge-Adventurer-5M-Pro');
      expect(threeMf?.supportUsed).toEqual(false);
      expect(threeMf?.fileNames).toEqual(['3DBenchy.drc']);
    });

    it('should parse the embedded thumbnail', () => {
      const threeMf = result.threeMf;
      expect(threeMf).toBeDefined();
      expect(threeMf?.plateImage).toEqual(
        expect.stringContaining('data:image/png;base64,')
      );
    });

    it('should parse filament info from slice_info.config', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.filaments).toBeDefined();
      expect(threeMf?.filaments).toHaveLength(1);

      const firstFilament = threeMf?.filaments?.[0];
      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      expect(firstFilament.id).toEqual('1');
      expect(firstFilament.type).toEqual('PLA');
      expect(firstFilament.color).toEqual('#26A69A');
      expect(firstFilament.usedM).toEqual('3.75');
      expect(firstFilament.usedG).toEqual('11.18');
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

    it('should parse warnings from slice_info.config', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.warnings).toBeDefined();
      expect(Array.isArray(threeMf?.warnings)).toBe(true);
      expect(threeMf?.warnings!.length).toBeGreaterThan(0);

      const firstWarning = threeMf?.warnings?.[0];
      expect(firstWarning).toBeDefined();
      if (!firstWarning) return;

      expect(firstWarning.msg).toEqual('bed_temperature_too_high_than_filament');
      expect(firstWarning.message).toContain('hot bed temperature is relatively high');
      expect(firstWarning.level).toEqual(3);
      expect(firstWarning.errorCode).toEqual('1000C001');
    });

    it('should parse first layer time', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.firstLayerTime).toBeDefined();
      expect(threeMf?.firstLayerTime).not.toBeNull();
      expect(typeof threeMf?.firstLayerTime).toBe('number');
      // Value from slice_info.config: 69.373428
      expect(threeMf?.firstLayerTime).toBeCloseTo(69.37, 1);
    });

    it('should parse per-extruder nozzle diameters (single extruder)', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.nozzleDiameters).toBeDefined();
      expect(threeMf?.nozzleDiameters).toEqual([0.4]);
    });
  });

  describe('FlashStudio Creator 5 Pro Two-Color 3MF (flashstudio_v1.7.6_creator5pro-2color.3mf)', () => {
    const threeMfPath = fixturesDir + '/flashstudio_v1.7.6_creator5pro-2color.3mf';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(threeMfPath);
    });

    it('should parse the file without error', () => {
      expect(result).toBeDefined();
    });

    it('should detect Flash Studio from embedded g-code', () => {
      const slicer = result.slicer;
      expect(slicer?.slicer).toBe(SlicerType.FlashStudio);
      expect(slicer?.slicerName).toEqual('Flash Studio');
      expect(slicer?.slicerVersion).toEqual('1.7.6');
      expect(slicer?.printEta).toEqual('28m18s');
    });

    it('should parse file metadata from embedded g-code', () => {
      const file = result.file;
      expect(file?.sliceSoft).toBe(SlicerType.FlashStudio);
      expect(file?.printerModel).toEqual('Flashforge Creator 5 Pro');
      expect(file?.filamentType).toEqual('PLA;PLA');
      expect(file?.filamentUsedMM).toEqual(1792.52);
      expect(file?.filamentUsedG).toEqual(5.35);
      expect(file?.filaments).toHaveLength(2);
    });

    it('should parse 3MF metadata', () => {
      const threeMf = result.threeMf;
      expect(threeMf).not.toBeNull();
      expect(threeMf?.printerModelId).toEqual('Flashforge-Creator-5-Pro');
      expect(threeMf?.supportUsed).toEqual(false);
      expect(threeMf?.fileNames).toEqual(['Assembly']);
    });

    it('should parse filament info from slice_info.config', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.filaments).toHaveLength(2);

      const f1 = threeMf?.filaments?.[0];
      const f2 = threeMf?.filaments?.[1];

      expect(f1?.id).toEqual('1');
      expect(f1?.type).toEqual('PLA');
      expect(f1?.color).toEqual('#FFFFFF');
      expect(f1?.usedM).toEqual('1.24');
      expect(f1?.usedG).toEqual('3.7');

      expect(f2?.id).toEqual('2');
      expect(f2?.type).toEqual('PLA');
      expect(f2?.color).toEqual('#00C1AE');
      expect(f2?.usedM).toEqual('0.55');
      expect(f2?.usedG).toEqual('1.65');
    });

    it('should parse multi-extruder nozzle diameters (4 extruders)', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.nozzleDiameters).toBeDefined();
      expect(threeMf?.nozzleDiameters).toEqual([0.4, 0.4, 0.4, 0.4]);
    });

    it('should parse first layer time', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.firstLayerTime).toBeDefined();
      expect(threeMf?.firstLayerTime).toBeCloseTo(147.93, 1);
    });

    it('should parse warnings from slice_info.config', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.warnings!.length).toBeGreaterThan(0);
      const firstWarning = threeMf?.warnings?.[0];
      expect(firstWarning?.msg).toEqual('bed_temperature_too_high_than_filament');
      expect(firstWarning?.level).toEqual(3);
      expect(firstWarning?.errorCode).toEqual('1000C001');
    });
  });
});
