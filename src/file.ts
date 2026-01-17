import { Base64 } from 'js-base64';
import { deflateRaw, inflate, inflateRaw } from 'pako';

import { FileSource } from './SceneProvider';
import { brotliCompress, brotliDecompress } from './file/brotli';
import { downloadScene, openFileBlob } from './file/blob';
import { openFileFs, saveFileFs } from './file/filesystem';
import { openFileLocalStorage, saveFileLocalStorage } from './file/localStorage';
import { decodeSceneBinary, encodeSceneBinary } from './file/sceneBinaryCodec';
import { upgradeScene } from './file/upgrade';
import { Scene } from './scene';

const URL_ENCODING_PREFIX = '~';
const BINARY_ENCODING_PREFIX = '~~';

export async function saveFile(scene: Readonly<Scene>, source: FileSource): Promise<void> {
    switch (source.type) {
        case 'local':
            await saveFileLocalStorage(scene, source.name);
            break;

        case 'fs':
            await saveFileFs(scene, source.handle);
            break;

        case 'blob':
            downloadScene(scene, source.name);
            break;
    }
}

export async function openFile(source: FileSource): Promise<Scene> {
    const scene = await openFileUnvalidated(source);
    return upgradeScene(scene);
}

async function openFileUnvalidated(source: FileSource) {
    switch (source.type) {
        case 'local':
            return await openFileLocalStorage(source.name);

        case 'fs':
            return await openFileFs(source.handle);

        case 'blob':
            if (!source.file) {
                throw new Error('File not set');
            }
            return await openFileBlob(source.file);
    }
}

export function sceneToText(scene: Readonly<Scene>): string {
    const json = JSON.stringify(scene);
    const compressed = deflateRaw(json, { level: 9, memLevel: 9 });

    const deflateText = URL_ENCODING_PREFIX + Base64.fromUint8Array(compressed, true);

    try {
        const brotliCandidates: string[] = [];

        for (const version of [3, 2]) {
            try {
                const binary = encodeSceneBinary(scene, version);
                const binaryCompressed = brotliCompress(binary, 11);
                brotliCandidates.push(BINARY_ENCODING_PREFIX + Base64.fromUint8Array(binaryCompressed, true));
            } catch (ex) {
                console.warn(`Failed to brotli-compress plan (codec v${version}), skipping.`, ex);
            }
        }

        const brotliText = brotliCandidates.reduce((best, s) => (best === '' || s.length < best.length ? s : best), '');

        return brotliText && brotliText.length < deflateText.length ? brotliText : deflateText;
    } catch (ex) {
        console.warn('Failed to brotli-compress plan for URL sharing, falling back to deflate.', ex);
        return deflateText;
    }
}

export function textToScene(data: string): Scene {
    if (data.startsWith(BINARY_ENCODING_PREFIX)) {
        const decompressed = brotliDecompress(Base64.toUint8Array(data.substring(BINARY_ENCODING_PREFIX.length)));
        return upgradeScene(decodeSceneBinary(decompressed));
    }

    if (data.startsWith(URL_ENCODING_PREFIX)) {
        const decompressed = inflateRaw(Base64.toUint8Array(data.substring(URL_ENCODING_PREFIX.length)));
        return jsonToScene(new TextDecoder().decode(decompressed));
    }

    const decompressed = inflate(Base64.toUint8Array(data));

    return jsonToScene(new TextDecoder().decode(decompressed));
}

export function sceneToJson(scene: Readonly<Scene>): string {
    return JSON.stringify(scene, undefined, 2);
}

export function jsonToScene(json: string): Scene {
    const scene = upgradeScene(JSON.parse(json));

    validateScene(scene);
    return scene;
}

function validateScene(obj: unknown): asserts obj is Scene {
    if (typeof obj !== 'object') {
        throw new Error('Expected an object');
    }

    // TODO: try to check that this is valid data
}
