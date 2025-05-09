import * as path from 'path';
import { parseSlicerFile, SlicerType, FilamentInfo } from '../src';
import * as fs from 'fs';

// --- Test Configuration ---
const fixturesDir = path.join(__dirname, 'fixtures');
const gcodeFilePath = path.join(fixturesDir, 'test.gcode');
const threeMfFilePath = path.join(fixturesDir, 'test.3mf');
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

    describe('G-Code Parsing (test.gcode)', () => {
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

    describe('3MF Parsing (test.3mf)', () => {
        let threeMfResult: Awaited<ReturnType<typeof parseSlicerFile>>; // Store result

        beforeAll(async () => {
            // 3MF parsing within parseSlicerFile is sync *after* file read, but await the promise
            threeMfResult = await parseSlicerFile(threeMfFilePath);
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

            // values from test.3mf
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

        it('should parse the embedded thumbnail', () => {
            const file = threeMfResult.file;
            expect(file).toBeDefined();
            expect(file?.thumbnail).toEqual(expect.stringContaining('data:image/png;base64,'));
        })

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