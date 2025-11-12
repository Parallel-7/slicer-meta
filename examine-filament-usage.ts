import AdmZip from 'adm-zip';
import * as path from 'path';

async function examineFilamentUsage() {
    const filePath = path.join(__dirname, 'test-file.3mf');
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    // Find the embedded G-code file
    const gcodeEntry = zipEntries.find(entry => entry.entryName.match(/^Metadata\/plate_\d+\.gcode$/));

    if (gcodeEntry) {
        const gcodeContent = gcodeEntry.getData().toString('utf-8');
        const lines = gcodeContent.split(/\r?\n/);

        console.log('==========================================');
        console.log('SEARCHING FOR FILAMENT USAGE DATA');
        console.log('==========================================\n');

        // Look for filament-related comments
        for (const line of lines) {
            const trimmed = line.trim();

            // Look for filament usage data
            if (trimmed.includes('filament') &&
                (trimmed.includes('used') ||
                 trimmed.includes('type') ||
                 trimmed.includes('colour') ||
                 trimmed.includes('color'))) {
                console.log(trimmed);
            }

            // Stop after we've seen the main metadata (don't print the whole file)
            if (trimmed.startsWith('M104 S') || trimmed.startsWith('G28')) {
                break;
            }
        }

        console.log('\n==========================================');
        console.log('KEY OBSERVATIONS:');
        console.log('==========================================\n');
    }
}

examineFilamentUsage();
