import { describe, it, expect, beforeAll } from 'vitest';
import { parseSlicerFile, SlicerType } from '../src';
import { orcaFFthreeMfFilePath, fixturesDir } from './test-utils';

describe('Slicer File Parser', () => {
  describe('Orca-FlashForge 3MF Parsing (orca-flashforge.3mf)', () => {
    let threeMfResult: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      threeMfResult = await parseSlicerFile(orcaFFthreeMfFilePath);
    });

    it('should parse the file without error', () => {
      expect(threeMfResult).toBeDefined();
    });

    it('should work with parseSlicerFile', () => {
      expect(threeMfResult).toHaveProperty('slicer');
      expect(threeMfResult).toHaveProperty('file');
      expect(threeMfResult).toHaveProperty('threeMf');
      expect(threeMfResult.threeMf).not.toBeNull();
    });

    it('should parse slicer metadata', () => {
      const threeMf = threeMfResult.threeMf;
      expect(threeMf).toBeDefined();

      // values from orca-flashforge.3mf
      expect(threeMf?.printerModelId).toEqual('Flashforge-Adventurer-5M-Pro');
      expect(threeMf?.supportUsed).toEqual(false);
      expect(threeMf?.fileNames).toEqual(['SunluHSOrange.stl']);
      expect(threeMf?.fileNames?.length).toBeGreaterThan(0);
      expect(threeMf?.filaments).toEqual(expect.any(Array));
      expect(threeMf?.filaments?.length).toBeGreaterThan(0);
    });

    it('should parse the embedded thumbnail', () => {
      const threeMf = threeMfResult.threeMf;
      expect(threeMf).toBeDefined();
      expect(threeMf?.plateImage).toEqual(
        expect.stringContaining('data:image/png;base64,')
      );
    });

    it('should parse filament metadata', () => {
      const filaments = threeMfResult.threeMf?.filaments;
      expect(filaments).toBeDefined();
      expect(filaments?.length).toBeGreaterThan(0);

      const firstFilament = filaments![0];
      expect(firstFilament).toBeDefined();

      expect(firstFilament.id).toEqual('1');
      expect(firstFilament.type).toEqual('PLA');
      expect(firstFilament.color).toEqual('#C0C0C0');
      expect(firstFilament.usedM).toEqual('1.22');
      expect(firstFilament.usedG).toEqual('3.64');
    });

    it('should parse slicer/file metadata from embedded g-code file', () => {
      const slicer = threeMfResult.slicer;
      const file = threeMfResult.file;

      expect(slicer).toBeDefined();
      expect(file).toBeDefined();

      expect(slicer?.slicer).toBe(SlicerType.OrcaFF);
      expect(slicer?.slicerName).toEqual('Orca-Flashforge');
      expect(file?.printerModel).toEqual('Flashforge Adventurer 5M Pro');
      expect(file?.filamentType).toEqual('PLA');
      expect(slicer?.printEta).toEqual('7m13s');
      expect(file?.filamentUsedMM).toEqual(1219.86);
      expect(file?.filamentUsedG).toEqual(3.64);
    });

    it('should populate file.filaments array from embedded g-code', () => {
      const file = threeMfResult.file;
      expect(file).toBeDefined();
      expect(file?.filaments).toBeDefined();
      expect(Array.isArray(file?.filaments)).toBe(true);
      expect(file?.filaments?.length).toBeGreaterThan(0);

      // Check first filament has correct structure
      const firstFilament = file?.filaments?.[0];
      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      expect(firstFilament).toHaveProperty('id');
      expect(firstFilament).toHaveProperty('type');
      expect(firstFilament).toHaveProperty('color');
      expect(firstFilament).toHaveProperty('usedM');
      expect(firstFilament).toHaveProperty('usedG');

      // Verify color is present for .3mf file
      expect(firstFilament.color).toBeDefined();
      expect(firstFilament.color).not.toBeNull();
      expect(firstFilament.color).toEqual('#C0C0C0');
    });

    it('should convert filament usage from mm to meters in file.filaments', () => {
      const file = threeMfResult.file;
      const firstFilament = file?.filaments?.[0];

      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      // usedM should be in meters (not millimeters)
      // If filamentUsedMM is 1219.86mm, usedM should be ~1.22m
      const expectedMeters = (file?.filamentUsedMM! / 1000).toFixed(2);
      expect(firstFilament.usedM).toEqual(expectedMeters);
    });

    it('should detect & parse the embedded thumbnail', () => {
      const file = threeMfResult.file;
      expect(file).toBeDefined();
      expect(file?.thumbnail).toEqual(
        expect.stringContaining('data:image/png;base64,')
      );
    });
  });

  describe('Orca-FlashForge Two Colors One Used (.gcode)', () => {
    const orcaFFTwoColorsGcodePath = fixturesDir + '/OrcaFF_TwoColors_OneUsed.gcode';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(orcaFFTwoColorsGcodePath);
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
      expect(slicer?.slicerName).toEqual('Orca-Flashforge');
    });

    it('should parse file metadata', () => {
      const file = result.file;
      expect(file).toBeDefined();
      expect(file?.filamentType).toEqual('PLA');
      expect(file?.filamentUsedMM).toEqual(3783.3);
      expect(file?.filamentUsedG).toEqual(11.28);
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
      expect(firstFilament.color).toEqual('#808000');
      expect(firstFilament.usedM).toEqual('3.78');
      expect(firstFilament.usedG).toEqual('11.28');
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

  describe('Orca-FlashForge Two Colors One Used (.3mf)', () => {
    const orcaFFTwoColors3mfPath = fixturesDir + '/OrcaFF_TwoColors_OneUsed.gcode.3mf';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(orcaFFTwoColors3mfPath);
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
      expect(file?.filamentUsedMM).toEqual(3783.3);
      expect(file?.filamentUsedG).toEqual(11.28);
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
      expect(firstFilament.color).toEqual('#808000');
      expect(firstFilament.usedM).toEqual('3.78');
      expect(firstFilament.usedG).toEqual('11.28');
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
      expect(firstFilament.color).toEqual('#808000');
      expect(firstFilament.usedM).toEqual('3.78');
      expect(firstFilament.usedG).toEqual('11.28');
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

  describe('Orca-FlashForge Three Colors One Used (.gcode)', () => {
    const orcaFFThreeColorsGcodePath = fixturesDir + '/OrcaFF_ThreeColors_OneUsed.gcode';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(orcaFFThreeColorsGcodePath);
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
      expect(slicer?.slicerName).toEqual('Orca-Flashforge');
    });

    it('should parse file metadata', () => {
      const file = result.file;
      expect(file).toBeDefined();
      expect(file?.filamentType).toEqual('PLA');
      expect(file?.filamentUsedMM).toEqual(3783.3);
      expect(file?.filamentUsedG).toEqual(11.28);
    });

    it('should filter file.filaments to only show used materials (1 of 3 configured)', () => {
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
      expect(firstFilament.color).toEqual('#808000');
      expect(firstFilament.usedM).toEqual('3.78');
      expect(firstFilament.usedG).toEqual('11.28');
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

  describe('Orca-FlashForge Three Colors One Used (.3mf)', () => {
    const orcaFFThreeColors3mfPath = fixturesDir + '/OrcaFF_ThreeColors_OneUsed.gcode.3mf';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(orcaFFThreeColors3mfPath);
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
      expect(file?.filamentUsedMM).toEqual(3783.3);
      expect(file?.filamentUsedG).toEqual(11.28);
    });

    it('should filter file.filaments to only show used materials (1 of 3 configured)', () => {
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
      expect(firstFilament.color).toEqual('#808000');
      expect(firstFilament.usedM).toEqual('3.78');
      expect(firstFilament.usedG).toEqual('11.28');
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
      expect(firstFilament.color).toEqual('#808000');
      expect(firstFilament.usedM).toEqual('3.78');
      expect(firstFilament.usedG).toEqual('11.28');
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

  describe('Orca-FlashForge PLA and SILK Multi-Material (.gcode)', () => {
    const orcaFFPLAandSILKGcodePath = fixturesDir + '/OrcaFF_PLA_and_SILK.gcode';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(orcaFFPLAandSILKGcodePath);
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
      expect(slicer?.slicerName).toEqual('Orca-Flashforge');
    });

    it('should parse file metadata with multiple material types', () => {
      const file = result.file;
      expect(file).toBeDefined();
      expect(file?.filamentType).toEqual('PLA;SILK');
      expect(file?.filamentUsedMM).toEqual(6266.79);
      expect(file?.filamentUsedG).toEqual(18.69);
    });

    it('should parse both filaments correctly (2 materials used)', () => {
      const file = result.file;
      expect(file?.filaments).toBeDefined();
      expect(file?.filaments).toHaveLength(2);
    });

    it('should have correct first filament properties (PLA)', () => {
      const file = result.file;
      const firstFilament = file?.filaments?.[0];

      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      expect(firstFilament.id).toEqual('0');
      expect(firstFilament.type).toEqual('PLA');
      expect(firstFilament.color).toEqual('#808000');
      expect(firstFilament.usedM).toEqual('3.17');
      expect(firstFilament.usedG).toEqual('9.46');
    });

    it('should have correct second filament properties (SILK)', () => {
      const file = result.file;
      const secondFilament = file?.filaments?.[1];

      expect(secondFilament).toBeDefined();
      if (!secondFilament) return;

      expect(secondFilament.id).toEqual('1');
      expect(secondFilament.type).toEqual('SILK');
      expect(secondFilament.color).toEqual('#00C1AE');
      expect(secondFilament.usedM).toEqual('3.10');
      expect(secondFilament.usedG).toEqual('9.23');
    });

    it('should convert filament usage from mm to meters', () => {
      const file = result.file;
      const firstFilament = file?.filaments?.[0];
      const secondFilament = file?.filaments?.[1];

      expect(firstFilament).toBeDefined();
      expect(secondFilament).toBeDefined();
      if (!firstFilament || !secondFilament) return;

      // Check both filaments have meters in reasonable range
      expect(parseFloat(firstFilament.usedM || '0')).toBeGreaterThan(0);
      expect(parseFloat(firstFilament.usedM || '0')).toBeLessThan(10);
      expect(parseFloat(secondFilament.usedM || '0')).toBeGreaterThan(0);
      expect(parseFloat(secondFilament.usedM || '0')).toBeLessThan(10);
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

  describe('Orca-FlashForge PLA and SILK Multi-Material (.3mf)', () => {
    const orcaFFPLAandSILK3mfPath = fixturesDir + '/OrcaFF_PLA_and_SILK.gcode.3mf';
    let result: Awaited<ReturnType<typeof parseSlicerFile>>;

    beforeAll(async () => {
      result = await parseSlicerFile(orcaFFPLAandSILK3mfPath);
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

    it('should parse file metadata with multiple material types', () => {
      const file = result.file;
      expect(file).toBeDefined();
      expect(file?.filamentType).toEqual('PLA;SILK');
      expect(file?.filamentUsedMM).toEqual(6266.79);
      expect(file?.filamentUsedG).toEqual(18.69);
    });

    it('should parse both filaments correctly in file.filaments (2 materials used)', () => {
      const file = result.file;
      expect(file?.filaments).toBeDefined();
      expect(file?.filaments).toHaveLength(2);
    });

    it('should have correct file.filaments first filament properties (PLA)', () => {
      const file = result.file;
      const firstFilament = file?.filaments?.[0];

      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      expect(firstFilament.type).toEqual('PLA');
      expect(firstFilament.color).toEqual('#808000');
      expect(firstFilament.usedM).toEqual('3.17');
      expect(firstFilament.usedG).toEqual('9.46');
    });

    it('should have correct file.filaments second filament properties (SILK)', () => {
      const file = result.file;
      const secondFilament = file?.filaments?.[1];

      expect(secondFilament).toBeDefined();
      if (!secondFilament) return;

      expect(secondFilament.type).toEqual('SILK');
      expect(secondFilament.color).toEqual('#00C1AE');
      expect(secondFilament.usedM).toEqual('3.10');
      expect(secondFilament.usedG).toEqual('9.23');
    });

    it('should parse the embedded thumbnail', () => {
      const threeMf = result.threeMf;
      expect(threeMf).toBeDefined();
      expect(threeMf?.plateImage).toEqual(
        expect.stringContaining('data:image/png;base64,')
      );
    });

    it('should parse both filaments correctly in threeMf.filaments', () => {
      const threeMf = result.threeMf;
      expect(threeMf?.filaments).toBeDefined();
      expect(threeMf?.filaments).toHaveLength(2);
    });

    it('should have correct threeMf.filaments first filament properties (PLA)', () => {
      const threeMf = result.threeMf;
      const firstFilament = threeMf?.filaments?.[0];

      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;

      expect(firstFilament.type).toEqual('PLA');
      expect(firstFilament.color).toEqual('#808000');
      expect(firstFilament.usedM).toEqual('3.17');
      expect(firstFilament.usedG).toEqual('9.46');
    });

    it('should have correct threeMf.filaments second filament properties (SILK)', () => {
      const threeMf = result.threeMf;
      const secondFilament = threeMf?.filaments?.[1];

      expect(secondFilament).toBeDefined();
      if (!secondFilament) return;

      expect(secondFilament.type).toEqual('SILK');
      expect(secondFilament.color).toEqual('#00C1AE');
      expect(secondFilament.usedM).toEqual('3.1');
      expect(secondFilament.usedG).toEqual('9.23');
    });

    it('should have consistent filament count between file and threeMf', () => {
      const file = result.file;
      const threeMf = result.threeMf;

      expect(file?.filaments?.length).toEqual(2);
      expect(threeMf?.filaments?.length).toEqual(2);
    });
  });
});
