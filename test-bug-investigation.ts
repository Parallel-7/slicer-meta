import { parseSlicerFile } from './src';
import * as path from 'path';

async function investigateBug() {
    const filePath = path.join(__dirname, 'test-file.3mf');

    console.log('==========================================');
    console.log('SLICER-META BUG INVESTIGATION');
    console.log('==========================================\n');
    console.log('Parsing file:', filePath);
    console.log('\n');

    try {
        const result = await parseSlicerFile(filePath);

        console.log('--- PARSING SUCCESSFUL ---\n');

        // Check threeMf data
        if (result.threeMf) {
            console.log('3MF METADATA:');
            console.log('-------------');
            console.log('Printer Model ID:', result.threeMf.printerModelId);
            console.log('Support Used:', result.threeMf.supportUsed);
            console.log('File Names:', result.threeMf.fileNames);
            console.log('\n');

            console.log('FILAMENTS ARRAY:');
            console.log('----------------');
            console.log('Number of filaments:', result.threeMf.filaments?.length || 0);
            console.log('\n');

            if (result.threeMf.filaments && result.threeMf.filaments.length > 0) {
                console.log('Detailed filament info:');
                result.threeMf.filaments.forEach((filament, index) => {
                    console.log(`\nFilament ${index + 1}:`);
                    console.log('  ID:', filament.id);
                    console.log('  Type:', filament.type);
                    console.log('  Color:', filament.color);
                    console.log('  Used (m):', filament.usedM);
                    console.log('  Used (g):', filament.usedG);
                });
                console.log('\n');

                // Create the material string as FlashForgeUI would see it
                const materialString = result.threeMf.filaments.map(f => f.type).join(';');
                console.log('MATERIAL STRING (as displayed in UI):');
                console.log('-------------------------------------');
                console.log(`"${materialString}"`);
                console.log('\n');
            }
        } else {
            console.log('No 3MF metadata found (this should not happen for a .3mf file!)');
        }

        // Check file metadata
        console.log('FILE METADATA:');
        console.log('--------------');
        console.log('Printer Model:', result.file?.printerModel);
        console.log('Filament Type:', result.file?.filamentType);
        console.log('Filament Used (mm):', result.file?.filamentUsedMM);
        console.log('Filament Used (g):', result.file?.filamentUsedG);
        console.log('\n');

        // Check slicer metadata
        console.log('SLICER METADATA:');
        console.log('----------------');
        console.log('Slicer:', result.slicer?.slicer);
        console.log('Slicer Name:', result.slicer?.slicerName);
        console.log('Slicer Version:', result.slicer?.slicerVersion);
        console.log('\n');

        console.log('==========================================');
        console.log('DIAGNOSIS:');
        console.log('==========================================');

        if (result.threeMf?.filaments) {
            const count = result.threeMf.filaments.length;
            console.log(`Parser returned ${count} filament(s)`);
            console.log('\n');

            if (count === 1) {
                console.log('✓ EXPECTED: Parser correctly returns 1 filament');
                console.log('➜ BUG IS IN: FlashForgeUI display logic');
            } else if (count === 3) {
                console.log('✗ BUG FOUND: Parser returns 3 filaments (all filament_settings files)');
                console.log('➜ BUG IS IN: slicer-meta parser (not filtering by slice_info.config)');
            } else if (count === 4) {
                console.log('✗ BUG FOUND: Parser returns 4 filaments (incorrect duplication)');
                console.log('➜ BUG IS IN: slicer-meta parser (duplication/parsing error)');
            } else {
                console.log(`⚠ UNEXPECTED: Parser returns ${count} filaments`);
                console.log('➜ Further investigation needed');
            }
        }

        console.log('==========================================\n');

        // Output full result as JSON for detailed inspection
        console.log('FULL RESULT (JSON):');
        console.log('-------------------');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('ERROR PARSING FILE:');
        console.error(error);
        process.exit(1);
    }
}

investigateBug();
