import { SlicerType } from './SlicerType';
import { FilamentInfo } from './FilamentInfo';

export class SlicerFileMeta {
    public thumbnail: string | null = null; // Base64 encoded PNG data URL, or just base64 data
    public filamentUsedMM: number = 0.0;
    public filamentUsedG: number = 0.0;
    public filamentType: string = "Unknown";
    public printerModel: string = "Unknown";
    public sliceSoft: SlicerType = SlicerType.Unknown;

    // Detailed per-filament information (filtered to show only used filaments)
    public filaments?: FilamentInfo[];

    constructor() {
        // Defaults are set via initializers
    }
}