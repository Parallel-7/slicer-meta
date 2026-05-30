import * as path from 'path';
import * as fs from 'fs';

// --- Test Configuration ---
export const fixturesDir = path.join(__dirname, 'fixtures');

// Path constants for test fixtures
export const gcodeFilePath = path.join(fixturesDir, 'flashprint_v2.4.4.gcode');
export const orcaGcodeFilePath = path.join(fixturesDir, 'orcaslicer_v2.3.0.gcode');
export const convertedGxFilePath = path.join(fixturesDir, 'converted.gx');
export const flashPrintGxFilePath = path.join(fixturesDir, 'FlashPrint.gx');
export const orcaFFthreeMfFilePath = path.join(fixturesDir, 'orca-flashforge_v1.3.0.3mf');
export const nonExistentFilePath = path.join(fixturesDir, 'nonexistent.file');
export const unsupportedFilePath = path.join(fixturesDir, 'test.txt');

// Ensure unsupported test file exists
export function ensureUnsupportedFileExists(): void {
    if (!fs.existsSync(unsupportedFilePath)) {
        try {
            fs.writeFileSync(unsupportedFilePath, 'This is not a gcode or 3mf file.');
        } catch (err) {
            console.warn(`Could not create dummy file ${unsupportedFilePath}. Error test might fail.`);
        }
    }
}

// Initialize test fixtures
ensureUnsupportedFileExists();
