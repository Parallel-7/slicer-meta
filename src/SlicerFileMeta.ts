import { SlicerType } from './SlicerType';

export class SlicerFileMeta {
    public thumbnail: string | null = null; // Base64 encoded PNG data URL, or just base64 data
    public filamentUsedMM: number = 0.0;
    public filamentUsedG: number = 0.0;
    public filamentType: string = "Unknown";
    public printerModel: string = "Unknown";
    public sliceSoft: SlicerType = SlicerType.Unknown;

    constructor() {
        // Defaults are set via initializers
    }
}