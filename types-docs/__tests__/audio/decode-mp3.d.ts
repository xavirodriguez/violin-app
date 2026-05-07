/**
 * MP3 decoder for tests using mpg123-decoder.
 * Decodes MP3 to Float32Array PCM.
 */
export declare function loadMp3AsFloat32(filename: string): Promise<{
    samples: Float32Array;
    sampleRate: number;
}>;
