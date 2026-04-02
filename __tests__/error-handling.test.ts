import { describe, it, expect, beforeAll } from 'vitest';
import { parseSlicerFile } from '../src';
import { nonExistentFilePath, unsupportedFilePath } from './test-utils';
import * as path from 'path';
import * as fs from 'fs';

describe('Slicer File Parser', () => {
  describe('Filament Filtering Bug Fix (test-file.3mf)', () => {
    const bugTestFilePath = path.join(__dirname, '..', 'test-file.3mf');
    let bugTestResult: Awaited<ReturnType<typeof parseSlicerFile>> | undefined;

    beforeAll(async () => {
      // Skip if test file doesn't exist
      if (fs.existsSync(bugTestFilePath)) {
        bugTestResult = await parseSlicerFile(bugTestFilePath);
      }
    });

    it('should parse file with multiple configured filaments but only one used', async () => {
      if (!fs.existsSync(bugTestFilePath)) {
        console.warn('Skipping filament filtering test - test-file.3mf not found');
        return;
      }

      expect(bugTestResult).toBeDefined();
      expect(bugTestResult!.threeMf).not.toBeNull();
    });

    it('should filter file.filamentType to show only used filaments', () => {
      if (!fs.existsSync(bugTestFilePath)) return;

      const file = bugTestResult?.file;
      expect(file).toBeDefined();

      // Should be "PLA", not "PLA;PETG;PETG;PETG"
      expect(file?.filamentType).toEqual('PLA');
      expect(file?.filamentType).not.toContain('PETG');
    });

    it('should filter file.filaments array to show only used filaments', () => {
      if (!fs.existsSync(bugTestFilePath)) return;

      const file = bugTestResult?.file;
      expect(file?.filaments).toBeDefined();
      expect(file?.filaments?.length).toEqual(1);

      const firstFilament = file?.filaments?.[0];
      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;
      expect(firstFilament.type).toEqual('PLA');

      // Verify color is present for .3mf file
      expect(firstFilament.color).toBeDefined();
      expect(firstFilament.color).not.toBeNull();
      expect(firstFilament.color).toEqual('#000000');
    });

    it('should filter threeMf.filaments array to show only used filaments', () => {
      if (!fs.existsSync(bugTestFilePath)) return;

      const threeMf = bugTestResult?.threeMf;
      expect(threeMf?.filaments).toBeDefined();
      expect(threeMf?.filaments?.length).toEqual(1);

      const firstFilament = threeMf?.filaments?.[0];
      expect(firstFilament).toBeDefined();
      if (!firstFilament) return;
      expect(firstFilament.type).toEqual('PLA');

      // Verify color is present for .3mf file
      expect(firstFilament.color).toBeDefined();
      expect(firstFilament.color).not.toBeNull();
      expect(firstFilament.color).toEqual('#000000');
    });

    it('should have consistent filament data between file and threeMf', () => {
      if (!fs.existsSync(bugTestFilePath)) return;

      const file = bugTestResult?.file;
      const threeMf = bugTestResult?.threeMf;

      // Both should report 1 filament
      expect(file?.filaments?.length).toEqual(threeMf?.filaments?.length);

      // Material type should match
      const fileFilament = file?.filaments?.[0];
      const threeMfFilament = threeMf?.filaments?.[0];
      expect(fileFilament).toBeDefined();
      expect(threeMfFilament).toBeDefined();
      if (!fileFilament || !threeMfFilament) return;

      expect(fileFilament.type).toEqual(threeMfFilament.type);
    });

    it('should convert units correctly in both file and threeMf filaments', () => {
      if (!fs.existsSync(bugTestFilePath)) return;

      const file = bugTestResult?.file;
      const threeMf = bugTestResult?.threeMf;

      const fileFilament = file?.filaments?.[0];
      const threeMfFilament = threeMf?.filaments?.[0];
      expect(fileFilament).toBeDefined();
      expect(threeMfFilament).toBeDefined();
      if (!fileFilament || !threeMfFilament) return;

      // file.filaments should show meters (converted from mm)
      const fileUsedM = parseFloat(fileFilament.usedM || '0');
      expect(fileUsedM).toBeGreaterThan(0);
      expect(fileUsedM).toBeLessThan(100); // Should be in meters, not mm

      // threeMf.filaments should also show meters
      const threeMfUsedM = parseFloat(threeMfFilament.usedM || '0');
      expect(threeMfUsedM).toBeGreaterThan(0);
      expect(threeMfUsedM).toBeLessThan(100); // Should be in meters, not mm

      // Values should be similar (within 1 meter due to rounding)
      expect(Math.abs(fileUsedM - threeMfUsedM)).toBeLessThan(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw an error for non-existent files', async () => {
      await expect(parseSlicerFile(nonExistentFilePath)).rejects.toThrow();
    });

    it('should throw an error for unsupported file types', async () => {
      if (!fs.existsSync(unsupportedFilePath)) {
        console.warn(
          `Skipping unsupported file type test - ${unsupportedFilePath} not found.`
        );
        return;
      }
      await expect(parseSlicerFile(unsupportedFilePath)).rejects.toThrow(
        /Unsupported file extension/
      );
    });
  });
});
