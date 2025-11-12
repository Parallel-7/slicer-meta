import * as path from 'path';
import { parseSlicerFile, SlicerType, FilamentInfo } from '../src';
import * as fs from 'fs';

// --- Test Configuration ---
const fixturesDir = path.join(__dirname, 'fixtures');
const gcodeFilePath = path.join(fixturesDir, 'test.gcode');
const orcaGcodeFilePath = path.join(fixturesDir, 'regular_orca_test.gcode');
const convertedGxFilePath = path.join(fixturesDir, 'converted.gx');
const flashPrintGxFilePath = path.join(fixturesDir, 'FlashPrint.gx');
const orcaFFthreeMfFilePath = path.join(fixturesDir, 'orca-flashforge.3mf');
const nonExistentFilePath = path.join(fixturesDir, 'nonexistent.file');
const unsupportedFilePath = path.join(fixturesDir, 'test.txt');

if (!fs.existsSync(unsupportedFilePath)) {
    try {
        fs.writeFileSync(unsupportedFilePath, 'This is not a gcode or 3mf file.');
    } catch (err) {
        console.warn(`Could not create dummy file ${unsupportedFilePath}. Error test might fail.`);
    }
}


describe('Slicer File Parser', () => {

    // Increase timeout slightly for parsing complex files if needed
    // jest.setTimeout(10000);

    describe('FlashPrint G-Code Parsing (test.gcode)', () => {
        let gcodeResult: Awaited<ReturnType<typeof parseSlicerFile>>; // Store result for logging

        // Use beforeAll to parse once per describe block
        beforeAll(async () => {
            gcodeResult = await parseSlicerFile(gcodeFilePath);
        });

        it('should parse the file without error', () => {
            // beforeAll handles the parsing, just check if result exists
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
        let gxResult: Awaited<ReturnType<typeof parseSlicerFile>>; // Store result for logging

        // Use beforeAll to parse once per describe block
        beforeAll(async () => {
            gxResult = await parseSlicerFile(convertedGxFilePath);
        });

        it('should parse the file without error', () => {
            // beforeAll handles the parsing, just check if result exists
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
        let flashprintGxResult: Awaited<ReturnType<typeof parseSlicerFile>>; // Store result for logging

        // Use beforeAll to parse once per describe block
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

    describe('Orca-FlashForge 3MF Parsing (orca-flashforge.3mf)', () => {
        let threeMfResult: Awaited<ReturnType<typeof parseSlicerFile>>; // Store result

        beforeAll(async () => {
            // 3MF parsing within parseSlicerFile is sync *after* file read, but await the promise
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
            expect(threeMf?.plateImage).toEqual(expect.stringContaining('data:image/png;base64,'));
        })


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
            expect(file?.thumbnail).toEqual(expect.stringContaining('data:image/png;base64,'));
        })

    });

    describe('Standard OrcaSlicer Parsing (regular_orca_test.gcode)', () => {
        let orcaGcodeResult: Awaited<ReturnType<typeof parseSlicerFile>>; // Store result for logging

        // Use beforeAll to parse once per describe block
        beforeAll(async () => {
            orcaGcodeResult = await parseSlicerFile(orcaGcodeFilePath);
        });

        it('should parse the file without error', () => {
            // beforeAll handles the parsing, just check if result exists
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

            // values from regular_orca_test.gcode
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
            file?.filaments?.forEach(filament => {
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
                expect(file.thumbnail).toEqual(expect.stringContaining('data:image/png;base64,'));
            }
        });
    });

    describe('Filament Filtering Bug Fix (test-file.3mf)', () => {
        const bugTestFilePath = path.join(__dirname, '..', 'test-file.3mf');
        let bugTestResult: Awaited<ReturnType<typeof parseSlicerFile>>;

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
            expect(bugTestResult.threeMf).not.toBeNull();
        });

        it('should filter file.filamentType to show only used filaments', () => {
            if (!fs.existsSync(bugTestFilePath)) return;

            const file = bugTestResult.file;
            expect(file).toBeDefined();

            // Should be "PLA", not "PLA;PETG;PETG;PETG"
            expect(file?.filamentType).toEqual('PLA');
            expect(file?.filamentType).not.toContain('PETG');
        });

        it('should filter file.filaments array to show only used filaments', () => {
            if (!fs.existsSync(bugTestFilePath)) return;

            const file = bugTestResult.file;
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

            const threeMf = bugTestResult.threeMf;
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

            const file = bugTestResult.file;
            const threeMf = bugTestResult.threeMf;

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

            const file = bugTestResult.file;
            const threeMf = bugTestResult.threeMf;

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
                console.warn(`Skipping unsupported file type test - ${unsupportedFilePath} not found.`);
                test.skip(`Skipping unsupported file type test - ${unsupportedFilePath} not found.`, () => {});
                return;
            }
            await expect(parseSlicerFile(unsupportedFilePath)).rejects.toThrow(/Unsupported file extension/);
        });
    });
});
