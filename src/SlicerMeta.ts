import { SlicerType } from './SlicerType';
import { ParserHelper } from './parser/ParserHelper'; // We'll create this next

export class SlicerMeta {
    public slicerName: string = "Unknown";
    public slicerVersion: string = "Error";
    public sliceDate: string = "Error";
    public sliceTime: string = "Error";
    public printEta: string | null = null; // e.g., "43m42s"
    public slicer: SlicerType = SlicerType.Unknown;

    constructor() {
        // Defaults set via initializers
    }

    public fromGeneratedByString(slicerType: SlicerType, line: string): this {
        this.slicer = slicerType;
        const cleanedLine = line.replace(";", "").trim();
        const data = cleanedLine.split(/\s+/); // Split by whitespace

        try {
            switch (slicerType) {
                // ; generated by ffslicer 2.4.4 12/03/24 15:13:28
                // 0          1   2        3    4        5
                case SlicerType.FlashPrint:
                    if (data.length >= 6) {
                        this.slicerName = data[2];
                        this.slicerVersion = data[3];
                        this.sliceDate = data[4];
                        this.sliceTime = ParserHelper.parseSliceTime(data[5]);
                    } else {
                        this.resetToDefaults("Invalid FlashPrint header line");
                    }
                    break;

                // ; generated by Orca-Flashforge 1.1.0 on 2024-12-03 at 15:16:09
                // 0          1  2                3    4  5          6  7
                case SlicerType.OrcaFF:
                case SlicerType.LegacyGX: // Same format for both - ; generated by OrcaSlicer 2.3.1-dev on 2025-05-12 at 21:32:19
                    // Handle potential variations like "OrcaSlicer" vs "Orca-Flashforge"
                    if (data.length >= 8 && data[1] === 'by') {
                        this.slicerName = data[2]; // Might include hyphen like "Orca-Flashforge"
                        this.slicerVersion = data[3];
                        this.sliceDate = data[5]; // Date part
                        this.sliceTime = ParserHelper.parseSliceTime(data[7]); // Time part
                    } else {
                        this.resetToDefaults("Invalid OrcaFF/LegacyGX header line");
                    }
                    break;

                default:
                case SlicerType.Unknown:
                    this.resetToDefaults("Unknown slicer type");
                    break;
            }
        } catch (error) {
            this.resetToDefaults(`Error parsing header line: ${error}`);
        }

        return this;
    }

    public setEta(etaLine: string): void {
        const cleanedLine = etaLine.replace(/^;\s*/, '').trim(); // Remove leading "; "
        let parsedEta: string | null = null; // Initialize to null

        try {
            // New format (Orca >= 1.3.0)
            // ; estimated printing time (normal mode) = 37m 30s
            // ; estimated printing time = 1h 5m 2s
            let match = cleanedLine.match(/estimated printing time.*=\s*((?:\d+h\s*)?(?:\d+m\s*)?(?:\d+s)?)/);
            if (match && match[1]) {
                parsedEta = match[1].trim().replace(/\s+/g, '');
                // console.log(`DEBUG: Matched new ETA format: ${parsedEta}`);
            }

            // Old format (Orca < 1.3.0)
            // ; model printing time: 43m 42s; total estimated time: 43m 42s
            if (!parsedEta) {
                match = cleanedLine.match(/total estimated time:\s*((?:\d+h\s*)?(?:\d+m\s*)?(?:\d+s)?)/);
                if (match && match[1]) {
                    parsedEta = match[1].trim().replace(/\s+/g, '');
                    // console.log(`DEBUG: Matched old ETA format: ${parsedEta}`);
                }
            }

            // Fallback for simpler patterns if primary ones fail
            if (!parsedEta) {
                match = cleanedLine.match(/=\s*((?:\d+h\s*)?(?:\d+m\s*)?(?:\d+s)?)/);
                if (match && match[1]) {
                    parsedEta = match[1].trim().replace(/\s+/g, '');
                    // console.log(`DEBUG: Matched fallback ETA format: ${parsedEta}`);
                }
            }
            if (parsedEta) {
                this.printEta = parsedEta;
            } else {
                console.warn(`Could not parse ETA line: "${etaLine}"`);
            }

        } catch (error) {
            console.error(`Error parsing ETA line: "${etaLine}"`, error);
            this.printEta = null;
        }
    }

    private resetToDefaults(reason: string): void {
        console.warn(`Resetting SlicerMeta to defaults. Reason: ${reason}`);
        this.slicerName = "Unknown";
        this.slicerVersion = "Error";
        this.sliceDate = "Error";
        this.sliceTime = "Error";
        this.printEta = null;
        this.slicer = SlicerType.Unknown;
    }
}