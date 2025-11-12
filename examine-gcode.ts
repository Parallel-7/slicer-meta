import AdmZip from 'adm-zip';
import * as path from 'path';

async function examineGCode() {
    const filePath = path.join(__dirname, 'test-file.3mf');
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    // Find the embedded G-code file
    const gcodeEntry = zipEntries.find(entry => entry.entryName.match(/^Metadata\/plate_\d+\.gcode$/));

    if (gcodeEntry) {
        const gcodeContent = gcodeEntry.getData().toString('utf-8');
        const lines = gcodeContent.split(/\r?\n/);

        let inConfigBlock = false;

        console.log('==========================================');
        console.log('EXAMINING CONFIG_BLOCK IN EMBEDDED G-CODE');
        console.log('==========================================\n');

        for (const line of lines) {
            if (line.includes('CONFIG_BLOCK_START')) {
                inConfigBlock = true;
                console.log('Found CONFIG_BLOCK_START\n');
                continue;
            }

            if (line.includes('CONFIG_BLOCK_END')) {
                inConfigBlock = false;
                console.log('\nFound CONFIG_BLOCK_END');
                break;
            }

            if (inConfigBlock && line.includes('filament')) {
                console.log(line);
            }
        }

        console.log('\n==========================================\n');
    }
}

examineGCode();
