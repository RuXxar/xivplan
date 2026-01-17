import brotliPromise from 'brotli-wasm';

const brotli = await brotliPromise;

export function brotliCompress(data: Uint8Array, quality = 11): Uint8Array {
    return brotli.compress(data, { quality });
}

export function brotliDecompress(data: Uint8Array): Uint8Array {
    return brotli.decompress(data);
}

