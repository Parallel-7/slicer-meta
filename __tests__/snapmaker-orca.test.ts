import { describe, it, expect, beforeAll } from 'vitest';
import { parseSlicerFile, SlicerType } from '../src';
import { fixturesDir } from './test-utils';

describe('Slicer File Parser', () => {
  describe('Snapmaker Orca G-code Parsing (snapmaker-orca_v2.3.4_3dbenchy-1color.gcode)', () => {
    const gcodePath = fixturesDir + '/snapmaker-orca_v2.3.4_3dbenchy-1color.gcode';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(gcodePath);
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

    it('should detect Snapmaker Orca as the slicer type', () => {
      const slicer = result.slicer;
      expect(slicer).toBeDefined();
      expect(slicer?.slicer).toBe(SlicerType.SnapmakerOrca);
      expect(slicer?.slicerName).toEqual('Snapmaker Orca');
      expect(slicer?.slicerVersion).toEqual('2.3.4');
    });

    it('should parse slicer date and time', () => {
      const slicer = result.slicer;
      expect(slicer?.sliceDate).toEqual('2026-06-25');
      expect(slicer?.sliceTime).toBeDefined();
      expect(slicer?.sliceTime).not.toEqual('Error');
    });

    it('should parse print ETA', () => {
      const slicer = result.slicer;
      expect(slicer?.printEta).toEqual('1h34m28s');
    });

    it('should parse file metadata', () => {
      const file = result.file;
      expect(file).toBeDefined();
      expect(file?.sliceSoft).toBe(SlicerType.SnapmakerOrca);
      expect(file?.printerModel).toEqual('Flashforge AD5X');
      expect(file?.filamentType).toEqual('PLA');
      expect(file?.filamentUsedMM).toEqual(3681.11);
      expect(file?.filamentUsedG).toEqual(10.98);
    });

    it('should parse filaments array (single color)', () => {
      const file = result.file;
      expect(file?.filaments).toBeDefined();
      expect(file?.filaments).toHaveLength(1);

      const firstFilament = file?.filaments?.[0];
      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      expect(firstFilament.type).toEqual('PLA');
      expect(firstFilament.color).toEqual('#26A69A');
      expect(firstFilament.usedM).toEqual('3.68');
      expect(firstFilament.usedG).toEqual('10.98');
    });

    it('should parse print settings (layer height, infill, layer count)', () => {
      const file = result.file;
      expect(file?.layerHeight).toEqual(0.12);
      expect(file?.infillDensity).toEqual(15);
      expect(file?.layerCount).toEqual(400);
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

  describe('Snapmaker Orca Two-Color G-code (snapmaker-orca_v2.3.4_pokerchip-2color.gcode)', () => {
    const gcodePath = fixturesDir + '/snapmaker-orca_v2.3.4_pokerchip-2color.gcode';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(gcodePath);
    });

    it('should parse the file without error', () => {
      expect(result).toBeDefined();
    });

    it('should detect Snapmaker Orca as the slicer type', () => {
      const slicer = result.slicer;
      expect(slicer?.slicer).toBe(SlicerType.SnapmakerOrca);
      expect(slicer?.slicerName).toEqual('Snapmaker Orca');
      expect(slicer?.slicerVersion).toEqual('2.3.4');
      expect(slicer?.printEta).toEqual('1h19m7s');
    });

    it('should parse file metadata with two used filaments', () => {
      const file = result.file;
      expect(file?.sliceSoft).toBe(SlicerType.SnapmakerOrca);
      expect(file?.printerModel).toEqual('Flashforge AD5X');
      expect(file?.filamentType).toEqual('PLA;PLA');
      expect(file?.filamentUsedMM).toEqual(1900.33);
      expect(file?.filamentUsedG).toEqual(5.67);
      expect(file?.filaments).toHaveLength(2);
    });

    it('should parse print settings (layer height, infill, layer count)', () => {
      const file = result.file;
      expect(file?.layerHeight).toEqual(0.12);
      expect(file?.infillDensity).toEqual(15);
      expect(file?.layerCount).toEqual(28);
    });

    it('should have correct per-filament properties', () => {
      const file = result.file;
      const f0 = file?.filaments?.[0];
      const f1 = file?.filaments?.[1];

      expect(f0?.type).toEqual('PLA');
      expect(f0?.color).toEqual('#FFFFFF');
      expect(f0?.usedM).toEqual('1.25');
      expect(f0?.usedG).toEqual('3.73');

      expect(f1?.type).toEqual('PLA');
      expect(f1?.color).toEqual('#0D6284');
      expect(f1?.usedM).toEqual('0.65');
      expect(f1?.usedG).toEqual('1.94');
    });
  });

  describe('Snapmaker Orca Two-Color 3MF (snapmaker-orca_v2.3.4_pokerchip-2color.3mf)', () => {
    const threeMfPath = fixturesDir + '/snapmaker-orca_v2.3.4_pokerchip-2color.3mf';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(threeMfPath);
    });

    it('should parse the file without error', () => {
      expect(result).toBeDefined();
    });

    it('should work with parseSlicerFile', () => {
      expect(result.threeMf).not.toBeNull();
      expect(result.slicer).toBeDefined();
      expect(result.file).toBeDefined();
    });

    it('should detect Snapmaker Orca from embedded g-code', () => {
      const slicer = result.slicer;
      expect(slicer?.slicer).toBe(SlicerType.SnapmakerOrca);
      expect(slicer?.slicerName).toEqual('Snapmaker Orca');
      expect(slicer?.slicerVersion).toEqual('2.3.4');
    });

    it('should parse file metadata from embedded g-code', () => {
      const file = result.file;
      expect(file?.sliceSoft).toBe(SlicerType.SnapmakerOrca);
      expect(file?.filamentType).toEqual('PLA;PLA');
      expect(file?.filamentUsedMM).toEqual(1900.33);
      expect(file?.filamentUsedG).toEqual(5.67);
    });

    it('should parse print settings from embedded g-code (layer height, infill, layer count)', () => {
      const file = result.file;
      expect(file?.layerHeight).toEqual(0.12);
      expect(file?.infillDensity).toEqual(15);
      expect(file?.layerCount).toEqual(28);
    });

    it('should parse 3MF metadata', () => {
      const threeMf = result.threeMf;
      expect(threeMf).toBeDefined();
      expect(threeMf?.printerModelId).toEqual('Flashforge-AD5X');
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
      expect(f1?.usedM).toEqual('1.25');
      expect(f1?.usedG).toEqual('3.73');

      expect(f2?.id).toEqual('2');
      expect(f2?.type).toEqual('PLA');
      expect(f2?.color).toEqual('#0D6284');
      expect(f2?.usedM).toEqual('0.65');
      expect(f2?.usedG).toEqual('1.94');
    });

    it('should parse per-extruder nozzle diameters (single extruder)', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.nozzleDiameters).toBeDefined();
      expect(threeMf?.nozzleDiameters).toEqual([0.25]);
    });

    it('should have consistent filament data between file and threeMf', () => {
      const file = result.file;
      const threeMf = result.threeMf;

      expect(file?.filaments?.length).toEqual(threeMf?.filaments?.length);

      for (let i = 0; i < (file?.filaments?.length ?? 0); i++) {
        expect(file?.filaments?.[i].type).toEqual(threeMf?.filaments?.[i].type);
        expect(file?.filaments?.[i].color).toEqual(threeMf?.filaments?.[i].color);
        expect(file?.filaments?.[i].usedM).toEqual(threeMf?.filaments?.[i].usedM);
        expect(file?.filaments?.[i].usedG).toEqual(threeMf?.filaments?.[i].usedG);
      }
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
      expect(firstWarning.level).toEqual(1);
      expect(firstWarning.errorCode).toEqual('1000C001');
    });

    it('should not report first layer time when absent', () => {
      const threeMf = result.threeMf;
      // Snapmaker Orca's slice_info.config does not emit first_layer_time
      expect(threeMf?.firstLayerTime).toBeNull();
    });

    it('should parse the embedded plate image', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.plateImage).toEqual(
        expect.stringContaining('data:image/png;base64,')
      );
    });
  });
});
