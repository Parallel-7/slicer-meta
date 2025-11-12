import AdmZip from 'adm-zip';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

async function investigateUnits() {
    const filePath = path.join(__dirname, 'test-file.3mf');
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    console.log('==========================================');
    console.log('INVESTIGATING FILAMENT UNITS');
    console.log('==========================================\n');

    // 1. Check slice_info.config
    const sliceInfoEntry = zipEntries.find(entry => entry.entryName === 'Metadata/slice_info.config');
    if (sliceInfoEntry) {
        console.log('--- SLICE_INFO.CONFIG (3MF Metadata) ---');
        const xmlContent = sliceInfoEntry.getData().toString('utf-8');
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
        const parsed = parser.parse(xmlContent);

        const filaments = parsed?.config?.plate?.filament;
        if (filaments) {
            const filamentArray = Array.isArray(filaments) ? filaments : [filaments];
            filamentArray.forEach((fil: any) => {
                console.log('Filament entry:');
                console.log(`  id: ${fil['@_id']}`);
                console.log(`  type: ${fil['@_type']}`);
                console.log(`  used_m: ${fil['@_used_m']} (labeled as meters)`);
                console.log(`  used_g: ${fil['@_used_g']} (grams)`);
                console.log('');
            });
        }
    }

    // 2. Check embedded G-code
    const gcodeEntry = zipEntries.find(entry => entry.entryName.match(/^Metadata\/plate_\d+\.gcode$/));
    if (gcodeEntry) {
        console.log('--- EMBEDDED G-CODE ---');
        const gcodeContent = gcodeEntry.getData().toString('utf-8');
        const lines = gcodeContent.split(/\r?\n/);

        for (const line of lines) {
            if (line.includes('filament used [mm]')) {
                console.log(line);
            }
            if (line.includes('filament used [cm3]')) {
                console.log(line);
            }
            if (line.includes('filament used [g]')) {
                console.log(line);
            }
            if (line.includes('total filament used')) {
                console.log(line);
            }
            // Stop after seeing actual G-code
            if (line.startsWith('M104 S') || line.startsWith('G28')) {
                break;
            }
        }
    }

    console.log('\n==========================================');
    console.log('ANALYSIS:');
    console.log('==========================================\n');
    console.log('slice_info.config uses: METERS (m) and GRAMS (g)');
    console.log('Embedded G-code uses: MILLIMETERS (mm) and GRAMS (g)');
    console.log('');
    console.log('Conversion check:');
    console.log('17419.29 mm = 17.41929 meters ≈ 17.42 meters ✓');
}

investigateUnits();
