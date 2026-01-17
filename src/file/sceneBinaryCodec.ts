import { Job, getJob, getJobIconUrl } from '../jobs';
import {
    ArcZone,
    Arena,
    ArenaShape,
    ArrowObject,
    CircleZone,
    ConeZone,
    DonutZone,
    DrawObject,
    EnemyObject,
    EnemyRingStyle,
    EyeObject,
    ExaflareZone,
    FakeCursorObject,
    Grid,
    GridType,
    IconObject,
    LineZone,
    MarkerObject,
    ObjectType,
    PartyObject,
    PolygonZone,
    RectangleZone,
    Scene,
    SceneObject,
    SceneStep,
    StackZone,
    StarburstZone,
    Tether,
    TetherType,
    TextObject,
    TickType,
    Ticks,
    TowerZone,
} from '../scene';

const CODEC_VERSION_V1 = 1;
const CODEC_VERSION_V2 = 2;
const CODEC_VERSION_V3 = 3;
const LATEST_CODEC_VERSION = CODEC_VERSION_V3;

const DISCORD_MEDIA_HOST = 'media.discordapp.net';
const DISCORD_CDN_HOST = 'cdn.discordapp.com';

const DISCORD_FILE_CODES: Record<string, number> = {
    'image.png': 0,
    'image.webp': 1,
    'image.jpg': 2,
    'image.jpeg': 3,
    'image.gif': 4,
};
const DISCORD_FILE_CODE_TO_NAME = Object.entries(DISCORD_FILE_CODES).reduce<Record<number, string>>((acc, [k, v]) => {
    acc[v] = k;
    return acc;
}, {});
const DISCORD_FILE_OTHER_CODE = 255;

const DISCORD_FORMAT_CODES: Record<string, number> = {
    webp: 1,
    png: 2,
    jpg: 3,
    jpeg: 4,
    gif: 5,
};
const DISCORD_FORMAT_CODE_TO_NAME = Object.entries(DISCORD_FORMAT_CODES).reduce<Record<number, string>>((acc, [k, v]) => {
    acc[v] = k;
    return acc;
}, {});

const DISCORD_QUALITY_CODES: Record<string, number> = {
    lossless: 1,
    low: 2,
    medium: 3,
    high: 4,
    auto: 5,
};
const DISCORD_QUALITY_CODE_TO_NAME = Object.entries(DISCORD_QUALITY_CODES).reduce<Record<number, string>>((acc, [k, v]) => {
    acc[v] = k;
    return acc;
}, {});

const COLOR_PALETTE = [
    '#ff0000',
    '#fc972b',
    '#ffc800',
    '#00e622',
    '#00d5e8',
    '#0066ff',
    '#8b57fa',
    '#f269ff',
    '#bf00ff',
    '#bae3ff',
    '#20052e',
    '#ffffff',
    '#000000',
    '#f13b66',
    '#e1dc5d',
    '#65b3ea',
    '#e291e6',
    '#40352c',
] as const;

const COLOR_INDEX = new Map<string, number>(COLOR_PALETTE.map((c, i) => [c, i]));

const ALL_JOBS: readonly Job[] = Object.values(Job).filter((x): x is Job => typeof x === 'number');

const PARTY_PRESETS = ALL_JOBS.map((job) => {
    const { name, icon } = getJob(job);
    return { image: getJobIconUrl(icon), name };
});
const PARTY_PRESET_INDEX = new Map<string, number>(
    PARTY_PRESETS.map((preset, index) => [`${preset.image}\n${preset.name}`, index]),
);

const OBJECT_TYPE_CODES = [
    ObjectType.Arc,
    ObjectType.Arrow,
    ObjectType.Circle,
    ObjectType.Cone,
    ObjectType.Cursor,
    ObjectType.Donut,
    ObjectType.Draw,
    ObjectType.Enemy,
    ObjectType.Exaflare,
    ObjectType.Eye,
    ObjectType.Icon,
    ObjectType.Knockback,
    ObjectType.Line,
    ObjectType.LineKnockAway,
    ObjectType.LineKnockback,
    ObjectType.LineStack,
    ObjectType.Marker,
    ObjectType.Party,
    ObjectType.Polygon,
    ObjectType.Proximity,
    ObjectType.Rect,
    ObjectType.RightTriangle,
    ObjectType.RotateCCW,
    ObjectType.RotateCW,
    ObjectType.Stack,
    ObjectType.Starburst,
    ObjectType.Tether,
    ObjectType.Text,
    ObjectType.Tower,
    ObjectType.Triangle,
] as const;

const OBJECT_TYPE_TO_CODE = new Map<ObjectType, number>(OBJECT_TYPE_CODES.map((t, i) => [t, i]));

// For flags > 0xFF, we encode them as varints. These bits start at 0x100 so the common case stays 1 byte.
const FLAG_HIDE = 0x100;
const FLAG_PINNED = 0x200;

const PARTY_FLAG_ROTATION = 0x01;
const PARTY_FLAG_SIZE = 0x02;
const PARTY_FLAG_OPACITY = 0x04;
const PARTY_FLAG_PRESET = 0x08;

const ENEMY_FLAG_NAME = 0x01;
const ENEMY_FLAG_ROTATION = 0x02;
const ENEMY_FLAG_OPACITY = 0x04;
const ENEMY_FLAG_RING = 0x08;

const ZONE_FLAG_HOLLOW = 0x01;
const ZONE_FLAG_OPACITY = 0x02;
const ZONE_FLAG_ROTATION = 0x04;

// Codec v2: pack common zone opacities into the flags byte instead of writing a separate varint.
const ZONE_V2_OPACITY_SHIFT = 1;
const ZONE_V2_OPACITY_MASK = 0x0e;
const ZONE_V2_FLAG_ROTATION = 0x10;
const ZONE_V2_OPACITY_CUSTOM = 7;
const ZONE_V2_OPACITY_FROM_CODE: Record<number, number> = {
    1: 50,
    2: 30,
    3: 100,
    4: 25,
    5: 60,
    6: 40,
};

const TEXT_FLAG_STYLE = 0x01;
const TEXT_FLAG_ALIGN = 0x02;
const TEXT_FLAG_FONT_SIZE = 0x04;
const TEXT_FLAG_COLOR = 0x08;
const TEXT_FLAG_OPACITY = 0x10;
const TEXT_FLAG_ROTATION = 0x20;
const TEXT_FLAG_STROKE = 0x40;

const IMAGE_FLAG_SIZE = 0x01;
const IMAGE_FLAG_ROTATION = 0x02;
const IMAGE_FLAG_OPACITY = 0x04;

const ARROW_FLAG_OPACITY = 0x01;
const ARROW_FLAG_ROTATION = 0x02;
const ARROW_FLAG_END = 0x04;
const ARROW_FLAG_BEGIN = 0x08;

const MARKER_FLAG_SHAPE = 0x01;
const MARKER_FLAG_OPACITY = 0x02;

const DEFAULT_OPACITY_AOE = 35;
const DEFAULT_OPACITY_ENEMY = 65;
const DEFAULT_OPACITY_IMAGE = 100;
const DEFAULT_OPACITY_TEXT = 100;
const DEFAULT_OPACITY_TETHER = 80;

const DEFAULT_PARTY_SIZE = 32;
const DEFAULT_TEXT_ALIGN = 'center';
const DEFAULT_TEXT_COLOR = '#ffffff';
const DEFAULT_TEXT_FONT_SIZE = 25;
const DEFAULT_TEXT_STYLE = 'outline';
const DEFAULT_TEXT_STROKE = '#40352c';

const DEFAULT_TETHER_WIDTH = 6;
const DEFAULT_TETHER_COLOR_LINE = '#fc972b';
const DEFAULT_TETHER_COLOR_CLOSE = '#00e622';
const DEFAULT_TETHER_COLOR_FAR = '#bf00ff';

const TETHER_FLAG_TYPE = 0x01;
const TETHER_FLAG_WIDTH = 0x02;
const TETHER_FLAG_OPACITY = 0x04;
const TETHER_FLAG_COLOR = 0x08;

const DEFAULT_MARKER_SHAPE = 'circle';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

class ByteWriter {
    private readonly data: number[] = [];

    writeU8(value: number): void {
        this.data.push(value & 0xff);
    }

    writeBytes(bytes: Uint8Array): void {
        for (const b of bytes) {
            this.data.push(b);
        }
    }

    writeUVar(value: number): void {
        let v = value >>> 0;
        while (v > 0x7f) {
            this.writeU8((v & 0x7f) | 0x80);
            v >>>= 7;
        }
        this.writeU8(v);
    }

    writeSVar(value: number): void {
        const v = value | 0;
        const zigzag = (v << 1) ^ (v >> 31);
        this.writeUVar(zigzag >>> 0);
    }

    writeUVarBig(value: bigint): void {
        let v = value;
        while (v > 0x7fn) {
            this.writeU8(Number(v & 0x7fn) | 0x80);
            v >>= 7n;
        }
        this.writeU8(Number(v));
    }

    writeString(value: string): void {
        const bytes = textEncoder.encode(value);
        this.writeUVar(bytes.length);
        this.writeBytes(bytes);
    }

    writeF32(value: number): void {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setFloat32(0, value, true);
        this.writeBytes(new Uint8Array(buf));
    }

    toUint8Array(): Uint8Array {
        return Uint8Array.from(this.data);
    }
}

class ByteReader {
    private offset = 0;

    constructor(private readonly data: Uint8Array) {}

    readU8(): number {
        const value = this.data[this.offset];
        if (value === undefined) {
            throw new Error('Unexpected end of data');
        }
        this.offset++;
        return value;
    }

    readBytes(length: number): Uint8Array {
        const end = this.offset + length;
        if (end > this.data.length) {
            throw new Error('Unexpected end of data');
        }
        const bytes = this.data.subarray(this.offset, end);
        this.offset = end;
        return bytes;
    }

    readUVar(): number {
        let result = 0;
        let shift = 0;
        while (true) {
            const byte = this.readU8();
            result |= (byte & 0x7f) << shift;
            if ((byte & 0x80) === 0) {
                return result >>> 0;
            }
            shift += 7;
            if (shift > 35) {
                throw new Error('Varint too large');
            }
        }
    }

    readSVar(): number {
        const value = this.readUVar();
        return (value >>> 1) ^ -(value & 1);
    }

    readUVarBig(): bigint {
        let result = 0n;
        let shift = 0n;
        while (true) {
            const byte = BigInt(this.readU8());
            result |= (byte & 0x7fn) << shift;
            if ((byte & 0x80n) === 0n) {
                return result;
            }
            shift += 7n;
            if (shift > 128n) {
                throw new Error('Varint too large');
            }
        }
    }

    readString(): string {
        const length = this.readUVar();
        const bytes = this.readBytes(length);
        return textDecoder.decode(bytes);
    }

    readF32(): number {
        const bytes = this.readBytes(4);
        return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat32(0, true);
    }
}

function encodeCoord(value: number): number {
    return Math.round(value * 2);
}

function decodeCoord(value: number): number {
    return value / 2;
}

function hexToBytes(hex: string): Uint8Array {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return out;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function writeColor(writer: ByteWriter, color: string): void {
    const idx = COLOR_INDEX.get(color);
    if (idx !== undefined) {
        writer.writeUVar(idx + 1);
        return;
    }

    // Custom color.
    writer.writeUVar(0);
    const hex = /^#([0-9a-fA-F]{6})$/.exec(color)?.[1];
    if (hex) {
        writer.writeU8(0);
        writer.writeBytes(hexToBytes(hex));
    } else {
        writer.writeU8(1);
        writer.writeString(color);
    }
}

function readColor(reader: ByteReader): string {
    const code = reader.readUVar();
    if (code > 0) {
        const color = COLOR_PALETTE[code - 1];
        if (!color) {
            throw new Error('Invalid color palette index');
        }
        return color;
    }

    const mode = reader.readU8();
    if (mode === 0) {
        const rgb = reader.readBytes(3);
        return `#${bytesToHex(rgb)}`;
    }
    if (mode === 1) {
        return reader.readString();
    }

    throw new Error('Invalid color encoding');
}

type EncodedDiscordBackground = {
    readonly host: typeof DISCORD_MEDIA_HOST | typeof DISCORD_CDN_HOST;
    readonly channelId: bigint;
    readonly attachmentId: bigint;
    readonly fileName: string;
    readonly ex?: string;
    readonly is?: string;
    readonly hm?: string;
    readonly format?: string;
    readonly quality?: string;
    readonly width?: number;
    readonly height?: number;
};

function encodeDiscordBackground(urlString: string): EncodedDiscordBackground | undefined {
    let url: URL;
    try {
        url = new URL(urlString);
    } catch {
        return undefined;
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return undefined;
    }
    if (url.hostname !== DISCORD_MEDIA_HOST && url.hostname !== DISCORD_CDN_HOST) {
        return undefined;
    }

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 4 || parts[0] !== 'attachments') {
        return undefined;
    }

    const channel = parts[1];
    const attachment = parts[2];
    const fileName = parts.slice(3).join('/');

    if (!channel || !attachment) {
        return undefined;
    }
    if (!/^[0-9]+$/.test(channel) || !/^[0-9]+$/.test(attachment)) {
        return undefined;
    }

    // If there are unexpected query params, fall back to storing the whole URL as a string.
    const knownKeys = new Set(['ex', 'is', 'hm', 'format', 'quality', 'width', 'height', '']);
    for (const key of url.searchParams.keys()) {
        if (!knownKeys.has(key)) {
            return undefined;
        }
    }

    const ex = url.searchParams.get('ex') ?? undefined;
    const is = url.searchParams.get('is') ?? undefined;
    const hm = url.searchParams.get('hm') ?? undefined;

    if (ex && !/^[0-9a-fA-F]{8}$/.test(ex)) {
        return undefined;
    }
    if (is && !/^[0-9a-fA-F]{8}$/.test(is)) {
        return undefined;
    }
    if (hm && !/^[0-9a-fA-F]{64}$/.test(hm)) {
        return undefined;
    }

    const width = url.searchParams.get('width');
    const height = url.searchParams.get('height');

    return {
        host: url.hostname as EncodedDiscordBackground['host'],
        channelId: BigInt(channel),
        attachmentId: BigInt(attachment),
        fileName,
        ex,
        is,
        hm,
        format: url.searchParams.get('format') ?? undefined,
        quality: url.searchParams.get('quality') ?? undefined,
        width: width ? Number.parseInt(width, 10) : undefined,
        height: height ? Number.parseInt(height, 10) : undefined,
    };
}

function writeDiscordBackground(writer: ByteWriter, url: EncodedDiscordBackground): void {
    // 0 = media.discordapp.net, 1 = cdn.discordapp.com
    writer.writeU8(url.host === DISCORD_MEDIA_HOST ? 0 : 1);
    writer.writeUVarBig(url.channelId);
    writer.writeUVarBig(url.attachmentId);

    const fileCode = DISCORD_FILE_CODES[url.fileName];
    if (fileCode !== undefined) {
        writer.writeU8(fileCode);
    } else {
        writer.writeU8(DISCORD_FILE_OTHER_CODE);
        writer.writeString(url.fileName);
    }

    let mask = 0;
    if (url.ex) mask |= 1;
    if (url.is) mask |= 2;
    if (url.hm) mask |= 4;
    if (url.format) mask |= 8;
    if (url.quality) mask |= 16;
    if (url.width !== undefined) mask |= 32;
    if (url.height !== undefined) mask |= 64;
    writer.writeU8(mask);

    if (url.ex) writer.writeBytes(hexToBytes(url.ex));
    if (url.is) writer.writeBytes(hexToBytes(url.is));
    if (url.hm) writer.writeBytes(hexToBytes(url.hm));

    if (url.format) {
        const code = DISCORD_FORMAT_CODES[url.format] ?? 0;
        writer.writeU8(code);
        if (code === 0) writer.writeString(url.format);
    }

    if (url.quality) {
        const code = DISCORD_QUALITY_CODES[url.quality] ?? 0;
        writer.writeU8(code);
        if (code === 0) writer.writeString(url.quality);
    }

    if (url.width !== undefined) writer.writeUVar(url.width);
    if (url.height !== undefined) writer.writeUVar(url.height);
}

function readDiscordBackground(reader: ByteReader): string {
    const hostBit = reader.readU8();
    const host = hostBit === 0 ? DISCORD_MEDIA_HOST : DISCORD_CDN_HOST;
    const channelId = reader.readUVarBig();
    const attachmentId = reader.readUVarBig();

    const fileCode = reader.readU8();
    const fileName =
        fileCode === DISCORD_FILE_OTHER_CODE ? reader.readString() : DISCORD_FILE_CODE_TO_NAME[fileCode] ?? 'image.png';

    const mask = reader.readU8();

    const params: Record<string, string> = {};

    if (mask & 1) params.ex = bytesToHex(reader.readBytes(4));
    if (mask & 2) params.is = bytesToHex(reader.readBytes(4));
    if (mask & 4) params.hm = bytesToHex(reader.readBytes(32));

    if (mask & 8) {
        const code = reader.readU8();
        params.format = code === 0 ? reader.readString() : (DISCORD_FORMAT_CODE_TO_NAME[code] ?? 'webp');
    }

    if (mask & 16) {
        const code = reader.readU8();
        params.quality = code === 0 ? reader.readString() : (DISCORD_QUALITY_CODE_TO_NAME[code] ?? 'lossless');
    }

    if (mask & 32) params.width = String(reader.readUVar());
    if (mask & 64) params.height = String(reader.readUVar());

    const url = new URL(`https://${host}/attachments/${channelId}/${attachmentId}/${fileName}`);
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
    }
    return url.toString();
}

type StringTable = {
    strings: string[];
    index: Map<string, number>;
};

function makeStringTable(scene: Readonly<Scene>): StringTable {
    const strings: string[] = [''];
    const index = new Map<string, number>([['', 0]]);

    const add = (value: string | undefined) => {
        const v = value ?? '';
        if (!index.has(v)) {
            index.set(v, strings.length);
            strings.push(v);
        }
    };

    const background = scene.arena.backgroundImage;
    if (background) {
        if (!encodeDiscordBackground(background)) {
            add(background);
        }
    }

    for (const step of scene.steps) {
        for (const obj of step.objects) {
            const type = obj.type as ObjectType;

            if (type === ObjectType.Party) {
                const party = obj as unknown as { image?: string; name?: string };
                const key = `${party.image ?? ''}\n${party.name ?? ''}`;
                if (!PARTY_PRESET_INDEX.has(key)) {
                    add(party.image);
                    add(party.name);
                }
                continue;
            }

            if (type === ObjectType.Enemy) {
                const enemy = obj as unknown as { icon?: string; name?: string };
                add(enemy.icon);
                add(enemy.name);
                continue;
            }

            if (type === ObjectType.Text) {
                const text = obj as unknown as { text?: string; align?: string };
                add(text.text);
                if (text.align && text.align !== DEFAULT_TEXT_ALIGN) {
                    add(text.align);
                }
                continue;
            }

            if (type === ObjectType.Marker || type === ObjectType.Icon) {
                const image = obj as unknown as { image?: string; name?: string };
                add(image.image);
                add(image.name);
                continue;
            }
        }
    }

    return { strings, index };
}

function getString(table: StringTable, idx: number): string {
    const value = table.strings[idx];
    if (value === undefined) {
        throw new Error('Invalid string table index');
    }
    return value;
}

function writeStringIndex(writer: ByteWriter, table: StringTable, value: string | undefined): void {
    writer.writeUVar(table.index.get(value ?? '') ?? 0);
}

function readStringIndex(reader: ByteReader, table: StringTable): string {
    return getString(table, reader.readUVar());
}

function getObjectTypeCode(type: ObjectType): number {
    const code = OBJECT_TYPE_TO_CODE.get(type);
    if (code === undefined) {
        throw new Error(`Unsupported object type: "${type}"`);
    }
    return code;
}

function getObjectTypeFromCode(code: number): ObjectType {
    const type = OBJECT_TYPE_CODES[code];
    if (!type) {
        throw new Error('Invalid object type code');
    }
    return type;
}

function getDefaultOpacity(type: ObjectType): number {
    if (type === ObjectType.Enemy) return DEFAULT_OPACITY_ENEMY;
    if (type === ObjectType.Tether) return DEFAULT_OPACITY_TETHER;

    switch (type) {
        case ObjectType.Party:
        case ObjectType.Marker:
        case ObjectType.Icon:
        case ObjectType.Arrow:
        case ObjectType.Text:
        case ObjectType.Draw:
            return DEFAULT_OPACITY_IMAGE;
        default:
            return DEFAULT_OPACITY_AOE;
    }
}

function getDefaultTetherColor(tether: TetherType): string {
    return tether === TetherType.Close
        ? DEFAULT_TETHER_COLOR_CLOSE
        : tether === TetherType.Far
          ? DEFAULT_TETHER_COLOR_FAR
          : DEFAULT_TETHER_COLOR_LINE;
}

function getZoneOpacityCodeV2(opacity: number, defaultOpacity: number): number {
    if (opacity === defaultOpacity) return 0;
    if (opacity === 50) return 1;
    if (opacity === 30) return 2;
    if (opacity === 100) return 3;
    if (opacity === 25) return 4;
    if (opacity === 60) return 5;
    if (opacity === 40) return 6;
    return ZONE_V2_OPACITY_CUSTOM;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function encodeStepKeyframe(objectBytes: readonly Uint8Array[]): Uint8Array {
    const writer = new ByteWriter();
    writer.writeUVar(objectBytes.length);
    for (const bytes of objectBytes) {
        writer.writeBytes(bytes);
    }
    return writer.toUint8Array();
}

function encodeStepDelta(objectBytes: readonly Uint8Array[], prevObjectBytes: readonly Uint8Array[]): Uint8Array {
    const writer = new ByteWriter();
    writer.writeUVar(objectBytes.length);

    let i = 0;
    while (i < objectBytes.length) {
        const cur = objectBytes[i];
        const prev = i < prevObjectBytes.length ? prevObjectBytes[i] : undefined;
        if (cur && prev && bytesEqual(cur, prev)) {
            let runLen = 1;
            while (i + runLen < objectBytes.length && i + runLen < prevObjectBytes.length) {
                const cur2 = objectBytes[i + runLen];
                const prev2 = prevObjectBytes[i + runLen];
                if (!cur2 || !prev2 || !bytesEqual(cur2, prev2)) break;
                runLen++;
            }

            // 0 = copy run from previous step
            writer.writeU8(0);
            writer.writeUVar(runLen);
            i += runLen;
            continue;
        }

        // 1 = literal object encoding
        writer.writeU8(1);
        if (!cur) {
            throw new Error('Internal error: missing object encoding');
        }
        writer.writeBytes(cur);
        i++;
    }

    return writer.toUint8Array();
}

function writeObjectBinary(
    writer: ByteWriter,
    obj: SceneObject,
    table: StringTable,
    idToIndex: Map<number, number>,
    version: number,
): void {
    const type = obj.type as ObjectType;
    writer.writeU8(getObjectTypeCode(type));

    const hide = !!(obj as unknown as { hide?: boolean }).hide;
    const pinned = !!(obj as unknown as { pinned?: boolean }).pinned;

    let flags = 0;
    if (hide) flags |= FLAG_HIDE;
    if (pinned) flags |= FLAG_PINNED;

    const defaultOpacity = getDefaultOpacity(type);
    const opacity = (obj as unknown as { opacity?: number }).opacity ?? defaultOpacity;

    if (type === ObjectType.Party) {
        const party = obj as unknown as {
            image: string;
            name: string;
            x: number;
            y: number;
            rotation?: number;
            width?: number;
            height?: number;
            opacity?: number;
        };

        const presetKey = `${party.image}\n${party.name}`;
        const preset = PARTY_PRESET_INDEX.get(presetKey);
        if (preset !== undefined) flags |= PARTY_FLAG_PRESET;

        if ((party.rotation ?? 0) !== 0) flags |= PARTY_FLAG_ROTATION;
        if ((party.width ?? DEFAULT_PARTY_SIZE) !== DEFAULT_PARTY_SIZE || (party.height ?? DEFAULT_PARTY_SIZE) !== DEFAULT_PARTY_SIZE)
            flags |= PARTY_FLAG_SIZE;
        if (opacity !== defaultOpacity) flags |= PARTY_FLAG_OPACITY;

        writer.writeUVar(flags);

        if (flags & PARTY_FLAG_PRESET) {
            writer.writeUVar(preset ?? 0);
        } else {
            writeStringIndex(writer, table, party.image);
            writeStringIndex(writer, table, party.name);
        }

        writer.writeSVar(encodeCoord(party.x));
        writer.writeSVar(encodeCoord(party.y));

        if (flags & PARTY_FLAG_ROTATION) writer.writeSVar(Math.round(party.rotation ?? 0));
        if (flags & PARTY_FLAG_SIZE) {
            writer.writeUVar(Math.round(party.width ?? DEFAULT_PARTY_SIZE));
            writer.writeUVar(Math.round(party.height ?? DEFAULT_PARTY_SIZE));
        }
        if (flags & PARTY_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
        return;
    }

    if (type === ObjectType.Enemy) {
        const enemy = obj as unknown as {
            icon: string;
            name: string;
            color: string;
            radius: number;
            x: number;
            y: number;
            rotation?: number;
            opacity?: number;
            ring?: EnemyRingStyle;
        };

        if (enemy.name) flags |= ENEMY_FLAG_NAME;
        if ((enemy.rotation ?? 0) !== 0) flags |= ENEMY_FLAG_ROTATION;
        if (opacity !== defaultOpacity) flags |= ENEMY_FLAG_OPACITY;
        if ((enemy.ring ?? EnemyRingStyle.Directional) !== EnemyRingStyle.Directional) flags |= ENEMY_FLAG_RING;

        writer.writeUVar(flags);
        writeStringIndex(writer, table, enemy.icon);
        if (flags & ENEMY_FLAG_NAME) writeStringIndex(writer, table, enemy.name);
        writeColor(writer, enemy.color);
        writer.writeUVar(Math.round(enemy.radius));
        writer.writeSVar(encodeCoord(enemy.x));
        writer.writeSVar(encodeCoord(enemy.y));
        if (flags & ENEMY_FLAG_ROTATION) writer.writeSVar(Math.round(enemy.rotation ?? 0));
        if (flags & ENEMY_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
        if (flags & ENEMY_FLAG_RING) {
            const ring = enemy.ring ?? EnemyRingStyle.Directional;
            writer.writeU8(ring === EnemyRingStyle.NoDirection ? 0 : ring === EnemyRingStyle.Omnidirectional ? 2 : 1);
        }
        return;
    }

    if (type === ObjectType.Text) {
        const text = obj as unknown as {
            text: string;
            x: number;
            y: number;
            style: string;
            align: string;
            fontSize: number;
            color: string;
            stroke: string;
            rotation?: number;
            opacity?: number;
        };

        if (text.style !== DEFAULT_TEXT_STYLE) flags |= TEXT_FLAG_STYLE;
        if (text.align !== DEFAULT_TEXT_ALIGN) flags |= TEXT_FLAG_ALIGN;
        if (text.fontSize !== DEFAULT_TEXT_FONT_SIZE) flags |= TEXT_FLAG_FONT_SIZE;
        if (text.color !== DEFAULT_TEXT_COLOR) flags |= TEXT_FLAG_COLOR;
        if (opacity !== DEFAULT_OPACITY_TEXT) flags |= TEXT_FLAG_OPACITY;
        if ((text.rotation ?? 0) !== 0) flags |= TEXT_FLAG_ROTATION;
        if (text.stroke !== DEFAULT_TEXT_STROKE) flags |= TEXT_FLAG_STROKE;

        writer.writeUVar(flags);
        writeStringIndex(writer, table, text.text);
        writer.writeSVar(encodeCoord(text.x));
        writer.writeSVar(encodeCoord(text.y));
        if (flags & TEXT_FLAG_STYLE) {
            writer.writeU8(text.style === 'shadow' ? 1 : text.style === 'plain' ? 2 : 0);
        }
        if (flags & TEXT_FLAG_ALIGN) writeStringIndex(writer, table, text.align);
        if (flags & TEXT_FLAG_FONT_SIZE) writer.writeUVar(Math.round(text.fontSize));
        if (flags & TEXT_FLAG_COLOR) writeColor(writer, text.color);
        if (flags & TEXT_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
        if (flags & TEXT_FLAG_ROTATION) writer.writeSVar(Math.round(text.rotation ?? 0));
        if (flags & TEXT_FLAG_STROKE) writeColor(writer, text.stroke);
        return;
    }

    if (type === ObjectType.Tether) {
        const tether = obj as unknown as {
            tether: TetherType;
            startId: number;
            endId: number;
            width: number;
            color: string;
            opacity?: number;
        };

        const startIndex = idToIndex.get(tether.startId) ?? 0;
        const endIndex = idToIndex.get(tether.endId) ?? 0;

        const tetherType = tether.tether ?? TetherType.Line;
        if (tetherType !== TetherType.Line) flags |= TETHER_FLAG_TYPE;
        if (tether.width !== DEFAULT_TETHER_WIDTH) flags |= TETHER_FLAG_WIDTH;
        if (opacity !== DEFAULT_OPACITY_TETHER) flags |= TETHER_FLAG_OPACITY;
        if (tether.color !== getDefaultTetherColor(tetherType)) flags |= TETHER_FLAG_COLOR;

        writer.writeUVar(flags);
        writer.writeUVar(startIndex);
        writer.writeUVar(endIndex);

        if (flags & TETHER_FLAG_TYPE) {
            writer.writeU8(
                tetherType === TetherType.Close
                    ? 1
                    : tetherType === TetherType.Far
                      ? 2
                      : tetherType === TetherType.MinusMinus
                        ? 3
                        : tetherType === TetherType.PlusMinus
                          ? 4
                          : tetherType === TetherType.PlusPlus
                            ? 5
                            : 0,
            );
        }

        if (flags & TETHER_FLAG_WIDTH) writer.writeUVar(Math.round(tether.width));
        if (flags & TETHER_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
        if (flags & TETHER_FLAG_COLOR) writeColor(writer, tether.color);
        return;
    }

    if (type === ObjectType.Marker) {
        const marker = obj as unknown as {
            name: string;
            image: string;
            shape?: string;
            color: string;
            x: number;
            y: number;
            width: number;
            height: number;
            rotation: number;
            opacity?: number;
        };

        if ((marker.shape ?? DEFAULT_MARKER_SHAPE) !== DEFAULT_MARKER_SHAPE) flags |= MARKER_FLAG_SHAPE;
        if (opacity !== DEFAULT_OPACITY_IMAGE) flags |= MARKER_FLAG_OPACITY;

        writer.writeUVar(flags);
        writeStringIndex(writer, table, marker.image);
        writeStringIndex(writer, table, marker.name);
        writer.writeSVar(encodeCoord(marker.x));
        writer.writeSVar(encodeCoord(marker.y));
        writer.writeUVar(Math.round(marker.width));
        writer.writeUVar(Math.round(marker.height));
        writer.writeSVar(Math.round(marker.rotation));
        if (flags & MARKER_FLAG_SHAPE) writer.writeU8((marker.shape ?? DEFAULT_MARKER_SHAPE) === 'square' ? 1 : 0);
        writeColor(writer, marker.color);
        if (flags & MARKER_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
        return;
    }

    if (type === ObjectType.Icon) {
        const icon = obj as unknown as {
            name: string;
            image: string;
            iconId?: number;
            maxStacks?: number;
            time?: number;
            x: number;
            y: number;
            width: number;
            height: number;
            rotation: number;
            opacity?: number;
        };

        if (icon.width !== DEFAULT_PARTY_SIZE || icon.height !== DEFAULT_PARTY_SIZE) flags |= IMAGE_FLAG_SIZE;
        if (icon.rotation !== 0) flags |= IMAGE_FLAG_ROTATION;
        if (opacity !== DEFAULT_OPACITY_IMAGE) flags |= IMAGE_FLAG_OPACITY;

        // iconId/maxStacks/time are optional and not common; store them only if present.
        if (icon.iconId !== undefined) flags |= 0x10;
        if (icon.maxStacks !== undefined) flags |= 0x20;
        if (icon.time !== undefined) flags |= 0x40;

        writer.writeUVar(flags);
        writeStringIndex(writer, table, icon.image);
        writeStringIndex(writer, table, icon.name);
        writer.writeSVar(encodeCoord(icon.x));
        writer.writeSVar(encodeCoord(icon.y));
        if (flags & IMAGE_FLAG_SIZE) {
            writer.writeUVar(Math.round(icon.width));
            writer.writeUVar(Math.round(icon.height));
        }
        if (flags & IMAGE_FLAG_ROTATION) writer.writeSVar(Math.round(icon.rotation));
        if (flags & IMAGE_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
        if (flags & 0x10) writer.writeUVar(Math.round(icon.iconId ?? 0));
        if (flags & 0x20) writer.writeUVar(Math.round(icon.maxStacks ?? 0));
        if (flags & 0x40) writer.writeUVar(Math.round(icon.time ?? 0));
        return;
    }

    if (type === ObjectType.Arrow) {
        const arrow = obj as unknown as {
            color: string;
            x: number;
            y: number;
            width: number;
            height: number;
            rotation: number;
            opacity?: number;
            arrowBegin?: boolean;
            arrowEnd?: boolean;
        };

        if (opacity !== DEFAULT_OPACITY_IMAGE) flags |= ARROW_FLAG_OPACITY;
        if (arrow.rotation !== 0) flags |= ARROW_FLAG_ROTATION;
        if (arrow.arrowEnd) flags |= ARROW_FLAG_END;
        if (arrow.arrowBegin) flags |= ARROW_FLAG_BEGIN;

        writer.writeUVar(flags);
        writeColor(writer, arrow.color);
        writer.writeUVar(Math.round(arrow.width));
        writer.writeUVar(Math.round(arrow.height));
        writer.writeSVar(encodeCoord(arrow.x));
        writer.writeSVar(encodeCoord(arrow.y));
        if (flags & ARROW_FLAG_ROTATION) writer.writeSVar(Math.round(arrow.rotation));
        if (flags & ARROW_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
        return;
    }

    if (type === ObjectType.Draw) {
        const draw = obj as unknown as DrawObject;
        // Draw objects contain floats; encode them losslessly as float32.
        if (opacity !== DEFAULT_OPACITY_IMAGE) flags |= 0x01;
        if (draw.rotation !== 0) flags |= 0x02;

        writer.writeUVar(flags);
        writeColor(writer, draw.color);
        writer.writeF32(draw.x);
        writer.writeF32(draw.y);
        writer.writeF32(draw.width);
        writer.writeF32(draw.height);
        if (flags & 0x02) writer.writeF32(draw.rotation);
        writer.writeUVar(draw.points.length);
        for (const p of draw.points) writer.writeF32(p);
        writer.writeUVar(Math.round(draw.brushSize));
        if (flags & 0x01) writer.writeUVar(Math.round(opacity));
        return;
    }

    // Zones and other objects
    const moveable = obj as unknown as { x?: number; y?: number };
    const rotateable = obj as unknown as { rotation?: number };

    const hollow = !!(obj as unknown as { hollow?: boolean }).hollow;
    const rotation = rotateable.rotation ?? 0;
    const opacityInt = Math.round(opacity);

    const supportsV2 = version >= CODEC_VERSION_V2;
    const zoneOpacityCode = supportsV2 ? getZoneOpacityCodeV2(opacityInt, defaultOpacity) : 0;
    const shouldWriteZoneOpacity = supportsV2 ? zoneOpacityCode === ZONE_V2_OPACITY_CUSTOM : opacityInt !== defaultOpacity;
    const shouldWriteZoneRotation = rotation !== 0;

    if (hollow) flags |= ZONE_FLAG_HOLLOW;
    if (supportsV2) {
        flags |= (zoneOpacityCode & 0x07) << ZONE_V2_OPACITY_SHIFT;
        if (shouldWriteZoneRotation) flags |= ZONE_V2_FLAG_ROTATION;
    } else {
        if (opacityInt !== defaultOpacity) flags |= ZONE_FLAG_OPACITY;
        if (shouldWriteZoneRotation) flags |= ZONE_FLAG_ROTATION;
    }

    writer.writeUVar(flags);

    if (
        type === ObjectType.Circle ||
        type === ObjectType.Proximity ||
        type === ObjectType.Knockback ||
        type === ObjectType.RotateCW ||
        type === ObjectType.RotateCCW
    ) {
        const circle = obj as unknown as { color: string; radius: number; x: number; y: number };
        writeColor(writer, circle.color);
        writer.writeUVar(Math.round(circle.radius));
        writer.writeSVar(encodeCoord(circle.x));
        writer.writeSVar(encodeCoord(circle.y));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (type === ObjectType.Donut) {
        const donut = obj as unknown as { color: string; radius: number; innerRadius: number; x: number; y: number };
        writeColor(writer, donut.color);
        writer.writeUVar(Math.round(donut.radius));
        writer.writeUVar(Math.round(donut.innerRadius));
        writer.writeSVar(encodeCoord(donut.x));
        writer.writeSVar(encodeCoord(donut.y));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (type === ObjectType.Eye) {
        const eye = obj as unknown as { color: string; radius: number; x: number; y: number; invert?: boolean };
        writer.writeU8(eye.invert ? 1 : 0);
        writeColor(writer, eye.color);
        writer.writeUVar(Math.round(eye.radius));
        writer.writeSVar(encodeCoord(eye.x));
        writer.writeSVar(encodeCoord(eye.y));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (type === ObjectType.Stack || type === ObjectType.Tower) {
        const stack = obj as unknown as { color: string; radius: number; count: number; x: number; y: number };
        writeColor(writer, stack.color);
        writer.writeUVar(Math.round(stack.radius));
        writer.writeUVar(Math.round(stack.count));
        writer.writeSVar(encodeCoord(stack.x));
        writer.writeSVar(encodeCoord(stack.y));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (type === ObjectType.Line) {
        const line = obj as unknown as { color: string; length: number; width: number; x: number; y: number; rotation: number };
        writeColor(writer, line.color);
        writer.writeUVar(Math.round(line.length));
        writer.writeUVar(Math.round(line.width));
        writer.writeSVar(encodeCoord(line.x));
        writer.writeSVar(encodeCoord(line.y));
        if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (type === ObjectType.Cone) {
        const cone = obj as unknown as { color: string; radius: number; coneAngle: number; x: number; y: number; rotation: number };
        writeColor(writer, cone.color);
        writer.writeUVar(Math.round(cone.radius));
        writer.writeUVar(Math.round(cone.coneAngle));
        writer.writeSVar(encodeCoord(cone.x));
        writer.writeSVar(encodeCoord(cone.y));
        if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (type === ObjectType.Arc) {
        const arc = obj as unknown as {
            color: string;
            radius: number;
            innerRadius: number;
            coneAngle: number;
            x: number;
            y: number;
            rotation: number;
        };
        writeColor(writer, arc.color);
        writer.writeUVar(Math.round(arc.radius));
        writer.writeUVar(Math.round(arc.innerRadius));
        writer.writeUVar(Math.round(arc.coneAngle));
        writer.writeSVar(encodeCoord(arc.x));
        writer.writeSVar(encodeCoord(arc.y));
        if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (
        type === ObjectType.Rect ||
        type === ObjectType.LineStack ||
        type === ObjectType.LineKnockback ||
        type === ObjectType.LineKnockAway ||
        type === ObjectType.Triangle ||
        type === ObjectType.RightTriangle
    ) {
        const rect = obj as unknown as { color: string; width: number; height: number; x: number; y: number; rotation: number };
        writeColor(writer, rect.color);
        writer.writeUVar(Math.round(rect.width));
        writer.writeUVar(Math.round(rect.height));
        writer.writeSVar(encodeCoord(rect.x));
        writer.writeSVar(encodeCoord(rect.y));
        if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (type === ObjectType.Polygon) {
        const poly = obj as unknown as {
            color: string;
            radius: number;
            sides: number;
            orient?: string;
            x: number;
            y: number;
            rotation: number;
        };
        const orient = poly.orient ?? 'point';
        const orientCode = orient === 'side' ? 1 : 0;
        writer.writeU8(orientCode);
        writeColor(writer, poly.color);
        writer.writeUVar(Math.round(poly.radius));
        writer.writeUVar(Math.round(poly.sides));
        writer.writeSVar(encodeCoord(poly.x));
        writer.writeSVar(encodeCoord(poly.y));
        if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (type === ObjectType.Exaflare) {
        const exa = obj as unknown as {
            color: string;
            radius: number;
            length: number;
            spacing: number;
            x: number;
            y: number;
            rotation: number;
        };
        writeColor(writer, exa.color);
        writer.writeUVar(Math.round(exa.radius));
        writer.writeUVar(Math.round(exa.length));
        writer.writeUVar(Math.round(exa.spacing));
        writer.writeSVar(encodeCoord(exa.x));
        writer.writeSVar(encodeCoord(exa.y));
        if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (type === ObjectType.Starburst) {
        const star = obj as unknown as {
            color: string;
            radius: number;
            spokes: number;
            spokeWidth: number;
            x: number;
            y: number;
            rotation: number;
        };
        writeColor(writer, star.color);
        writer.writeUVar(Math.round(star.radius));
        writer.writeUVar(Math.round(star.spokes));
        writer.writeUVar(Math.round(star.spokeWidth));
        writer.writeSVar(encodeCoord(star.x));
        writer.writeSVar(encodeCoord(star.y));
        if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    if (type === ObjectType.Cursor) {
        // Minimal cursor object
        writer.writeSVar(encodeCoord(moveable.x ?? 0));
        writer.writeSVar(encodeCoord(moveable.y ?? 0));
        if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
        return;
    }

    throw new Error(`Unsupported object type: "${type}"`);
}

function encodeObjectBinary(
    obj: SceneObject,
    table: StringTable,
    idToIndex: Map<number, number>,
    version: number,
): Uint8Array {
    const writer = new ByteWriter();
    writeObjectBinary(writer, obj, table, idToIndex, version);
    return writer.toUint8Array();
}

export function encodeSceneBinary(scene: Readonly<Scene>, version: number = LATEST_CODEC_VERSION): Uint8Array {
    const table = makeStringTable(scene);

    if (version !== CODEC_VERSION_V1 && version !== CODEC_VERSION_V2 && version !== CODEC_VERSION_V3) {
        throw new Error(`Unsupported plan codec version: ${version}`);
    }
    const writer = new ByteWriter();
    writer.writeU8(version);

    writer.writeUVar(table.strings.length);
    for (const s of table.strings) {
        writer.writeString(s);
    }

    // Arena
    const arena = scene.arena;
    const shapeCode = arena.shape === ArenaShape.Rectangle ? 1 : arena.shape === ArenaShape.Circle ? 2 : 0;
    writer.writeU8(shapeCode);
    writer.writeUVar(Math.round(arena.width));
    writer.writeUVar(Math.round(arena.height));
    writer.writeUVar(Math.round(arena.padding));

    const grid = arena.grid;
    const gridCode =
        grid.type === GridType.None
            ? 0
            : grid.type === GridType.Rectangular
              ? 1
              : grid.type === GridType.Radial
                ? 2
                : grid.type === GridType.CustomRectangular
                  ? 3
                  : 4;
    writer.writeU8(gridCode);

    if (gridCode === 1) {
        writer.writeUVar((grid as Grid & { rows: number }).rows);
        writer.writeUVar((grid as Grid & { columns: number }).columns);
    } else if (gridCode === 2) {
        const g = grid as Grid & { angularDivs: number; radialDivs: number; startAngle?: number };
        writer.writeUVar(g.angularDivs);
        writer.writeUVar(g.radialDivs);
        writer.writeSVar(Math.round(g.startAngle ?? 0));
    } else if (gridCode === 3) {
        const g = grid as Grid & { rows: number[]; columns: number[] };
        writer.writeUVar(g.rows.length);
        for (const v of g.rows) writer.writeSVar(Math.round(v));
        writer.writeUVar(g.columns.length);
        for (const v of g.columns) writer.writeSVar(Math.round(v));
    } else if (gridCode === 4) {
        const g = grid as Grid & { rings: number[]; spokes: number[] };
        writer.writeUVar(g.rings.length);
        for (const v of g.rings) writer.writeUVar(Math.round(v));
        writer.writeUVar(g.spokes.length);
        for (const v of g.spokes) writer.writeUVar(Math.round(v));
    }

    const ticks = arena.ticks;
    const tickCode = !ticks ? 0 : ticks.type === TickType.Rectangular ? 1 : ticks.type === TickType.Radial ? 2 : 0;
    writer.writeU8(tickCode);
    if (tickCode === 1) {
        const t = ticks as Ticks & { rows: number; columns: number };
        writer.writeUVar(t.rows);
        writer.writeUVar(t.columns);
    } else if (tickCode === 2) {
        const t = ticks as Ticks & { majorStart: number; majorCount: number; minorStart: number; minorCount: number };
        writer.writeSVar(Math.round(t.majorStart));
        writer.writeUVar(t.majorCount);
        writer.writeSVar(Math.round(t.minorStart));
        writer.writeUVar(t.minorCount);
    }

    if (!arena.backgroundImage) {
        writer.writeU8(0);
    } else {
        const encodedDiscord = encodeDiscordBackground(arena.backgroundImage);
        if (encodedDiscord) {
            writer.writeU8(2);
            writeDiscordBackground(writer, encodedDiscord);
        } else {
            writer.writeU8(1);
            writeStringIndex(writer, table, arena.backgroundImage);
        }
    }

    if (arena.backgroundOpacity === undefined) {
        writer.writeU8(0);
    } else {
        writer.writeU8(1);
        writer.writeUVar(Math.round(arena.backgroundOpacity));
    }

    // Steps
    writer.writeUVar(scene.steps.length);
    if (version >= CODEC_VERSION_V3) {
        let prevObjectBytes: Uint8Array[] | undefined;
        for (let stepIndex = 0; stepIndex < scene.steps.length; stepIndex++) {
            const step = scene.steps[stepIndex];
            if (!step) continue;
            const idToIndex = new Map<number, number>();
            step.objects.forEach((o, i) => idToIndex.set(o.id, i));

            const objectBytes = step.objects.map((o) => encodeObjectBinary(o, table, idToIndex, version));
            const keyframe = encodeStepKeyframe(objectBytes);

            if (stepIndex === 0 || !prevObjectBytes) {
                // 0 = keyframe
                writer.writeU8(0);
                writer.writeBytes(keyframe);
            } else {
                const delta = encodeStepDelta(objectBytes, prevObjectBytes);
                if (delta.length < keyframe.length) {
                    // 1 = delta-from-previous
                    writer.writeU8(1);
                    writer.writeBytes(delta);
                } else {
                    writer.writeU8(0);
                    writer.writeBytes(keyframe);
                }
            }

            prevObjectBytes = objectBytes;
        }
    } else {
        for (const step of scene.steps) {
        const idToIndex = new Map<number, number>();
        step.objects.forEach((o, i) => idToIndex.set(o.id, i));

        writer.writeUVar(step.objects.length);

        for (const obj of step.objects) {
            const type = obj.type as ObjectType;
            writer.writeU8(getObjectTypeCode(type));

            const hide = !!(obj as unknown as { hide?: boolean }).hide;
            const pinned = !!(obj as unknown as { pinned?: boolean }).pinned;

            let flags = 0;
            if (hide) flags |= FLAG_HIDE;
            if (pinned) flags |= FLAG_PINNED;

            const opacity = (obj as unknown as { opacity?: number }).opacity ?? getDefaultOpacity(type);
            const defaultOpacity = getDefaultOpacity(type);

            if (type === ObjectType.Party) {
                const party = obj as unknown as {
                    image: string;
                    name: string;
                    x: number;
                    y: number;
                    rotation?: number;
                    width?: number;
                    height?: number;
                    opacity?: number;
                };

                const presetKey = `${party.image}\n${party.name}`;
                const preset = PARTY_PRESET_INDEX.get(presetKey);
                if (preset !== undefined) flags |= PARTY_FLAG_PRESET;

                if ((party.rotation ?? 0) !== 0) flags |= PARTY_FLAG_ROTATION;
                if ((party.width ?? DEFAULT_PARTY_SIZE) !== DEFAULT_PARTY_SIZE || (party.height ?? DEFAULT_PARTY_SIZE) !== DEFAULT_PARTY_SIZE)
                    flags |= PARTY_FLAG_SIZE;
                if (opacity !== defaultOpacity) flags |= PARTY_FLAG_OPACITY;

                writer.writeUVar(flags);

                if (flags & PARTY_FLAG_PRESET) {
                    writer.writeUVar(preset ?? 0);
                } else {
                    writeStringIndex(writer, table, party.image);
                    writeStringIndex(writer, table, party.name);
                }

                writer.writeSVar(encodeCoord(party.x));
                writer.writeSVar(encodeCoord(party.y));

                if (flags & PARTY_FLAG_ROTATION) writer.writeSVar(Math.round(party.rotation ?? 0));
                if (flags & PARTY_FLAG_SIZE) {
                    writer.writeUVar(Math.round(party.width ?? DEFAULT_PARTY_SIZE));
                    writer.writeUVar(Math.round(party.height ?? DEFAULT_PARTY_SIZE));
                }
                if (flags & PARTY_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
                continue;
            }

            if (type === ObjectType.Enemy) {
                const enemy = obj as unknown as {
                    icon: string;
                    name: string;
                    color: string;
                    radius: number;
                    x: number;
                    y: number;
                    rotation?: number;
                    opacity?: number;
                    ring?: EnemyRingStyle;
                };

                if (enemy.name) flags |= ENEMY_FLAG_NAME;
                if ((enemy.rotation ?? 0) !== 0) flags |= ENEMY_FLAG_ROTATION;
                if (opacity !== defaultOpacity) flags |= ENEMY_FLAG_OPACITY;
                if ((enemy.ring ?? EnemyRingStyle.Directional) !== EnemyRingStyle.Directional) flags |= ENEMY_FLAG_RING;

                writer.writeUVar(flags);
                writeStringIndex(writer, table, enemy.icon);
                if (flags & ENEMY_FLAG_NAME) writeStringIndex(writer, table, enemy.name);
                writeColor(writer, enemy.color);
                writer.writeUVar(Math.round(enemy.radius));
                writer.writeSVar(encodeCoord(enemy.x));
                writer.writeSVar(encodeCoord(enemy.y));
                if (flags & ENEMY_FLAG_ROTATION) writer.writeSVar(Math.round(enemy.rotation ?? 0));
                if (flags & ENEMY_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
                if (flags & ENEMY_FLAG_RING) {
                    const ring = enemy.ring ?? EnemyRingStyle.Directional;
                    writer.writeU8(ring === EnemyRingStyle.NoDirection ? 0 : ring === EnemyRingStyle.Omnidirectional ? 2 : 1);
                }
                continue;
            }

            if (type === ObjectType.Text) {
                const text = obj as unknown as {
                    text: string;
                    x: number;
                    y: number;
                    style: string;
                    align: string;
                    fontSize: number;
                    color: string;
                    stroke: string;
                    rotation?: number;
                    opacity?: number;
                };

                if (text.style !== DEFAULT_TEXT_STYLE) flags |= TEXT_FLAG_STYLE;
                if (text.align !== DEFAULT_TEXT_ALIGN) flags |= TEXT_FLAG_ALIGN;
                if (text.fontSize !== DEFAULT_TEXT_FONT_SIZE) flags |= TEXT_FLAG_FONT_SIZE;
                if (text.color !== DEFAULT_TEXT_COLOR) flags |= TEXT_FLAG_COLOR;
                if (opacity !== DEFAULT_OPACITY_TEXT) flags |= TEXT_FLAG_OPACITY;
                if ((text.rotation ?? 0) !== 0) flags |= TEXT_FLAG_ROTATION;
                if (text.stroke !== DEFAULT_TEXT_STROKE) flags |= TEXT_FLAG_STROKE;

                writer.writeUVar(flags);
                writeStringIndex(writer, table, text.text);
                writer.writeSVar(encodeCoord(text.x));
                writer.writeSVar(encodeCoord(text.y));
                if (flags & TEXT_FLAG_STYLE) {
                    writer.writeU8(text.style === 'shadow' ? 1 : text.style === 'plain' ? 2 : 0);
                }
                if (flags & TEXT_FLAG_ALIGN) writeStringIndex(writer, table, text.align);
                if (flags & TEXT_FLAG_FONT_SIZE) writer.writeUVar(Math.round(text.fontSize));
                if (flags & TEXT_FLAG_COLOR) writeColor(writer, text.color);
                if (flags & TEXT_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
                if (flags & TEXT_FLAG_ROTATION) writer.writeSVar(Math.round(text.rotation ?? 0));
                if (flags & TEXT_FLAG_STROKE) writeColor(writer, text.stroke);
                continue;
            }

            if (type === ObjectType.Tether) {
                const tether = obj as unknown as {
                    tether: TetherType;
                    startId: number;
                    endId: number;
                    width: number;
                    color: string;
                    opacity?: number;
                };

                const startIndex = idToIndex.get(tether.startId) ?? 0;
                const endIndex = idToIndex.get(tether.endId) ?? 0;

                const tetherType = tether.tether ?? TetherType.Line;
                if (tetherType !== TetherType.Line) flags |= TETHER_FLAG_TYPE;
                if (tether.width !== DEFAULT_TETHER_WIDTH) flags |= TETHER_FLAG_WIDTH;
                if (opacity !== DEFAULT_OPACITY_TETHER) flags |= TETHER_FLAG_OPACITY;
                if (tether.color !== getDefaultTetherColor(tetherType)) flags |= TETHER_FLAG_COLOR;

                writer.writeUVar(flags);
                writer.writeUVar(startIndex);
                writer.writeUVar(endIndex);

                if (flags & TETHER_FLAG_TYPE) {
                    writer.writeU8(
                        tetherType === TetherType.Close
                            ? 1
                            : tetherType === TetherType.Far
                              ? 2
                              : tetherType === TetherType.MinusMinus
                                ? 3
                                : tetherType === TetherType.PlusMinus
                                  ? 4
                                  : tetherType === TetherType.PlusPlus
                                    ? 5
                                    : 0,
                    );
                }

                if (flags & TETHER_FLAG_WIDTH) writer.writeUVar(Math.round(tether.width));
                if (flags & TETHER_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
                if (flags & TETHER_FLAG_COLOR) writeColor(writer, tether.color);
                continue;
            }

            if (type === ObjectType.Marker) {
                const marker = obj as unknown as {
                    name: string;
                    image: string;
                    shape?: string;
                    color: string;
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    rotation: number;
                    opacity?: number;
                };

                if ((marker.shape ?? DEFAULT_MARKER_SHAPE) !== DEFAULT_MARKER_SHAPE) flags |= MARKER_FLAG_SHAPE;
                if (opacity !== DEFAULT_OPACITY_IMAGE) flags |= MARKER_FLAG_OPACITY;

                writer.writeUVar(flags);
                writeStringIndex(writer, table, marker.image);
                writeStringIndex(writer, table, marker.name);
                writer.writeSVar(encodeCoord(marker.x));
                writer.writeSVar(encodeCoord(marker.y));
                writer.writeUVar(Math.round(marker.width));
                writer.writeUVar(Math.round(marker.height));
                writer.writeSVar(Math.round(marker.rotation));
                if (flags & MARKER_FLAG_SHAPE) writer.writeU8((marker.shape ?? DEFAULT_MARKER_SHAPE) === 'square' ? 1 : 0);
                writeColor(writer, marker.color);
                if (flags & MARKER_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
                continue;
            }

            if (type === ObjectType.Icon) {
                const icon = obj as unknown as {
                    name: string;
                    image: string;
                    iconId?: number;
                    maxStacks?: number;
                    time?: number;
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    rotation: number;
                    opacity?: number;
                };

                if (icon.width !== DEFAULT_PARTY_SIZE || icon.height !== DEFAULT_PARTY_SIZE) flags |= IMAGE_FLAG_SIZE;
                if (icon.rotation !== 0) flags |= IMAGE_FLAG_ROTATION;
                if (opacity !== DEFAULT_OPACITY_IMAGE) flags |= IMAGE_FLAG_OPACITY;

                // iconId/maxStacks/time are optional and not common; store them only if present.
                if (icon.iconId !== undefined) flags |= 0x10;
                if (icon.maxStacks !== undefined) flags |= 0x20;
                if (icon.time !== undefined) flags |= 0x40;

                writer.writeUVar(flags);
                writeStringIndex(writer, table, icon.image);
                writeStringIndex(writer, table, icon.name);
                writer.writeSVar(encodeCoord(icon.x));
                writer.writeSVar(encodeCoord(icon.y));
                if (flags & IMAGE_FLAG_SIZE) {
                    writer.writeUVar(Math.round(icon.width));
                    writer.writeUVar(Math.round(icon.height));
                }
                if (flags & IMAGE_FLAG_ROTATION) writer.writeSVar(Math.round(icon.rotation));
                if (flags & IMAGE_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
                if (flags & 0x10) writer.writeUVar(Math.round(icon.iconId ?? 0));
                if (flags & 0x20) writer.writeUVar(Math.round(icon.maxStacks ?? 0));
                if (flags & 0x40) writer.writeUVar(Math.round(icon.time ?? 0));
                continue;
            }

            if (type === ObjectType.Arrow) {
                const arrow = obj as unknown as {
                    color: string;
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    rotation: number;
                    opacity?: number;
                    arrowBegin?: boolean;
                    arrowEnd?: boolean;
                };

                if (opacity !== DEFAULT_OPACITY_IMAGE) flags |= ARROW_FLAG_OPACITY;
                if (arrow.rotation !== 0) flags |= ARROW_FLAG_ROTATION;
                if (arrow.arrowEnd) flags |= ARROW_FLAG_END;
                if (arrow.arrowBegin) flags |= ARROW_FLAG_BEGIN;

                writer.writeUVar(flags);
                writeColor(writer, arrow.color);
                writer.writeUVar(Math.round(arrow.width));
                writer.writeUVar(Math.round(arrow.height));
                writer.writeSVar(encodeCoord(arrow.x));
                writer.writeSVar(encodeCoord(arrow.y));
                if (flags & ARROW_FLAG_ROTATION) writer.writeSVar(Math.round(arrow.rotation));
                if (flags & ARROW_FLAG_OPACITY) writer.writeUVar(Math.round(opacity));
                continue;
            }

            if (type === ObjectType.Draw) {
                const draw = obj as unknown as DrawObject;
                // Draw objects contain floats; encode them losslessly as float32.
                if (opacity !== DEFAULT_OPACITY_IMAGE) flags |= 0x01;
                if (draw.rotation !== 0) flags |= 0x02;

                writer.writeUVar(flags);
                writeColor(writer, draw.color);
                writer.writeF32(draw.x);
                writer.writeF32(draw.y);
                writer.writeF32(draw.width);
                writer.writeF32(draw.height);
                if (flags & 0x02) writer.writeF32(draw.rotation);
                writer.writeUVar(draw.points.length);
                for (const p of draw.points) writer.writeF32(p);
                writer.writeUVar(Math.round(draw.brushSize));
                if (flags & 0x01) writer.writeUVar(Math.round(opacity));
                continue;
            }

            // Zones and other objects
            const moveable = obj as unknown as { x?: number; y?: number };
            const rotateable = obj as unknown as { rotation?: number };

            const hollow = !!(obj as unknown as { hollow?: boolean }).hollow;
            const rotation = rotateable.rotation ?? 0;
            const opacityInt = Math.round(opacity);

            const isV2 = version === CODEC_VERSION_V2;
            const zoneOpacityCode = isV2 ? getZoneOpacityCodeV2(opacityInt, defaultOpacity) : 0;
            const shouldWriteZoneOpacity = isV2 ? zoneOpacityCode === ZONE_V2_OPACITY_CUSTOM : opacityInt !== defaultOpacity;
            const shouldWriteZoneRotation = rotation !== 0;

            if (hollow) flags |= ZONE_FLAG_HOLLOW;
            if (isV2) {
                flags |= (zoneOpacityCode & 0x07) << ZONE_V2_OPACITY_SHIFT;
                if (shouldWriteZoneRotation) flags |= ZONE_V2_FLAG_ROTATION;
            } else {
                if (opacityInt !== defaultOpacity) flags |= ZONE_FLAG_OPACITY;
                if (shouldWriteZoneRotation) flags |= ZONE_FLAG_ROTATION;
            }

            writer.writeUVar(flags);

            if (
                type === ObjectType.Circle ||
                type === ObjectType.Proximity ||
                type === ObjectType.Knockback ||
                type === ObjectType.RotateCW ||
                type === ObjectType.RotateCCW
            ) {
                const circle = obj as unknown as { color: string; radius: number; x: number; y: number };
                writeColor(writer, circle.color);
                writer.writeUVar(Math.round(circle.radius));
                writer.writeSVar(encodeCoord(circle.x));
                writer.writeSVar(encodeCoord(circle.y));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (type === ObjectType.Donut) {
                const donut = obj as unknown as { color: string; radius: number; innerRadius: number; x: number; y: number };
                writeColor(writer, donut.color);
                writer.writeUVar(Math.round(donut.radius));
                writer.writeUVar(Math.round(donut.innerRadius));
                writer.writeSVar(encodeCoord(donut.x));
                writer.writeSVar(encodeCoord(donut.y));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (type === ObjectType.Eye) {
                const eye = obj as unknown as { color: string; radius: number; x: number; y: number; invert?: boolean };
                writer.writeU8(eye.invert ? 1 : 0);
                writeColor(writer, eye.color);
                writer.writeUVar(Math.round(eye.radius));
                writer.writeSVar(encodeCoord(eye.x));
                writer.writeSVar(encodeCoord(eye.y));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (type === ObjectType.Stack || type === ObjectType.Tower) {
                const stack = obj as unknown as { color: string; radius: number; count: number; x: number; y: number };
                writeColor(writer, stack.color);
                writer.writeUVar(Math.round(stack.radius));
                writer.writeUVar(Math.round(stack.count));
                writer.writeSVar(encodeCoord(stack.x));
                writer.writeSVar(encodeCoord(stack.y));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (type === ObjectType.Line) {
                const line = obj as unknown as { color: string; length: number; width: number; x: number; y: number; rotation: number };
                writeColor(writer, line.color);
                writer.writeUVar(Math.round(line.length));
                writer.writeUVar(Math.round(line.width));
                writer.writeSVar(encodeCoord(line.x));
                writer.writeSVar(encodeCoord(line.y));
                if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (type === ObjectType.Cone) {
                const cone = obj as unknown as { color: string; radius: number; coneAngle: number; x: number; y: number; rotation: number };
                writeColor(writer, cone.color);
                writer.writeUVar(Math.round(cone.radius));
                writer.writeUVar(Math.round(cone.coneAngle));
                writer.writeSVar(encodeCoord(cone.x));
                writer.writeSVar(encodeCoord(cone.y));
                if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (type === ObjectType.Arc) {
                const arc = obj as unknown as {
                    color: string;
                    radius: number;
                    innerRadius: number;
                    coneAngle: number;
                    x: number;
                    y: number;
                    rotation: number;
                };
                writeColor(writer, arc.color);
                writer.writeUVar(Math.round(arc.radius));
                writer.writeUVar(Math.round(arc.innerRadius));
                writer.writeUVar(Math.round(arc.coneAngle));
                writer.writeSVar(encodeCoord(arc.x));
                writer.writeSVar(encodeCoord(arc.y));
                if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (
                type === ObjectType.Rect ||
                type === ObjectType.LineStack ||
                type === ObjectType.LineKnockback ||
                type === ObjectType.LineKnockAway ||
                type === ObjectType.Triangle ||
                type === ObjectType.RightTriangle
            ) {
                const rect = obj as unknown as { color: string; width: number; height: number; x: number; y: number; rotation: number };
                writeColor(writer, rect.color);
                writer.writeUVar(Math.round(rect.width));
                writer.writeUVar(Math.round(rect.height));
                writer.writeSVar(encodeCoord(rect.x));
                writer.writeSVar(encodeCoord(rect.y));
                if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (type === ObjectType.Polygon) {
                const poly = obj as unknown as {
                    color: string;
                    radius: number;
                    sides: number;
                    orient?: string;
                    x: number;
                    y: number;
                    rotation: number;
                };
                const orient = poly.orient ?? 'point';
                const orientCode = orient === 'side' ? 1 : 0;
                writer.writeU8(orientCode);
                writeColor(writer, poly.color);
                writer.writeUVar(Math.round(poly.radius));
                writer.writeUVar(Math.round(poly.sides));
                writer.writeSVar(encodeCoord(poly.x));
                writer.writeSVar(encodeCoord(poly.y));
                if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (type === ObjectType.Exaflare) {
                const exa = obj as unknown as {
                    color: string;
                    radius: number;
                    length: number;
                    spacing: number;
                    x: number;
                    y: number;
                    rotation: number;
                };
                writeColor(writer, exa.color);
                writer.writeUVar(Math.round(exa.radius));
                writer.writeUVar(Math.round(exa.length));
                writer.writeUVar(Math.round(exa.spacing));
                writer.writeSVar(encodeCoord(exa.x));
                writer.writeSVar(encodeCoord(exa.y));
                if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (type === ObjectType.Starburst) {
                const star = obj as unknown as {
                    color: string;
                    radius: number;
                    spokes: number;
                    spokeWidth: number;
                    x: number;
                    y: number;
                    rotation: number;
                };
                writeColor(writer, star.color);
                writer.writeUVar(Math.round(star.radius));
                writer.writeUVar(Math.round(star.spokes));
                writer.writeUVar(Math.round(star.spokeWidth));
                writer.writeSVar(encodeCoord(star.x));
                writer.writeSVar(encodeCoord(star.y));
                if (shouldWriteZoneRotation) writer.writeSVar(Math.round(rotation));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            if (type === ObjectType.Cursor) {
                // Minimal cursor object
                writer.writeSVar(encodeCoord(moveable.x ?? 0));
                writer.writeSVar(encodeCoord(moveable.y ?? 0));
                if (shouldWriteZoneOpacity) writer.writeUVar(opacityInt);
                continue;
            }

            throw new Error(`Unsupported object type: "${type}"`);
        }
    }
    }

    return writer.toUint8Array();
}

export function decodeSceneBinary(data: Uint8Array): Scene {
    const reader = new ByteReader(data);
    const version = reader.readU8();
    if (version !== CODEC_VERSION_V1 && version !== CODEC_VERSION_V2 && version !== CODEC_VERSION_V3) {
        throw new Error(`Unsupported plan codec version: ${version}`);
    }

    const tableCount = reader.readUVar();
    const strings: string[] = [];
    for (let i = 0; i < tableCount; i++) {
        strings.push(reader.readString());
    }
    const table: StringTable = { strings, index: new Map() };

    const readCoordX = (): number => decodeCoord(reader.readSVar());
    const readCoordY = (): number => decodeCoord(reader.readSVar());
    const supportsV2 = version >= CODEC_VERSION_V2;

    const readZoneRotation = (zoneFlags: number): number => {
        if (supportsV2) {
            return (zoneFlags & ZONE_V2_FLAG_ROTATION) !== 0 ? reader.readSVar() : 0;
        }
        return (zoneFlags & ZONE_FLAG_ROTATION) !== 0 ? reader.readSVar() : 0;
    };

    const readZoneOpacity = (zoneFlags: number, defaultOpacity: number): number => {
        if (supportsV2) {
            const code = (zoneFlags & ZONE_V2_OPACITY_MASK) >> ZONE_V2_OPACITY_SHIFT;
            if (code === 0) return defaultOpacity;
            if (code === ZONE_V2_OPACITY_CUSTOM) return reader.readUVar();

            const value = ZONE_V2_OPACITY_FROM_CODE[code];
            if (value === undefined) {
                throw new Error('Invalid zone opacity code');
            }
            return value;
        }

        return (zoneFlags & ZONE_FLAG_OPACITY) !== 0 ? reader.readUVar() : defaultOpacity;
    };

    // Arena
    const shapeCode = reader.readU8();
    const arenaShape =
        shapeCode === 1 ? ArenaShape.Rectangle : shapeCode === 2 ? ArenaShape.Circle : ArenaShape.None;
    const arenaWidth = reader.readUVar();
    const arenaHeight = reader.readUVar();
    const arenaPadding = reader.readUVar();

    const gridCode = reader.readU8();
    let grid: Grid;
    if (gridCode === 1) {
        grid = { type: GridType.Rectangular, rows: reader.readUVar(), columns: reader.readUVar() };
    } else if (gridCode === 2) {
        grid = {
            type: GridType.Radial,
            angularDivs: reader.readUVar(),
            radialDivs: reader.readUVar(),
            startAngle: reader.readSVar(),
        };
    } else if (gridCode === 3) {
        const rowsLen = reader.readUVar();
        const rows: number[] = [];
        for (let i = 0; i < rowsLen; i++) rows.push(reader.readSVar());
        const colsLen = reader.readUVar();
        const columns: number[] = [];
        for (let i = 0; i < colsLen; i++) columns.push(reader.readSVar());
        grid = { type: GridType.CustomRectangular, rows, columns };
    } else if (gridCode === 4) {
        const ringLen = reader.readUVar();
        const rings: number[] = [];
        for (let i = 0; i < ringLen; i++) rings.push(reader.readUVar());
        const spokeLen = reader.readUVar();
        const spokes: number[] = [];
        for (let i = 0; i < spokeLen; i++) spokes.push(reader.readUVar());
        grid = { type: GridType.CustomRadial, rings, spokes };
    } else {
        grid = { type: GridType.None };
    }

    const tickCode = reader.readU8();
    let ticks: Ticks | undefined;
    if (tickCode === 1) {
        ticks = { type: TickType.Rectangular, rows: reader.readUVar(), columns: reader.readUVar() };
    } else if (tickCode === 2) {
        ticks = {
            type: TickType.Radial,
            majorStart: reader.readSVar(),
            majorCount: reader.readUVar(),
            minorStart: reader.readSVar(),
            minorCount: reader.readUVar(),
        };
    } else {
        ticks = undefined;
    }

    const backgroundMode = reader.readU8();
    let backgroundImage: string | undefined;
    if (backgroundMode === 1) {
        backgroundImage = getString(table, reader.readUVar());
    } else if (backgroundMode === 2) {
        backgroundImage = readDiscordBackground(reader);
    }

    const hasBackgroundOpacity = reader.readU8();
    const backgroundOpacity = hasBackgroundOpacity ? reader.readUVar() : undefined;

    const arena: Arena = {
        shape: arenaShape,
        width: arenaWidth,
        height: arenaHeight,
        padding: arenaPadding,
        grid,
        ticks,
        backgroundImage,
        backgroundOpacity,
    };

    // Steps
    const stepsCount = reader.readUVar();
    const steps: SceneStep[] = [];

    let nextId = 1;
    type TetherPlaceholder = {
        readonly __tether: true;
        readonly start: number;
        readonly end: number;
        readonly data: Omit<Tether, 'startId' | 'endId'>;
    };

    const readObject = (): SceneObject | TetherPlaceholder => {
        const type = getObjectTypeFromCode(reader.readU8());
        const flags = reader.readUVar();

        const hide = (flags & FLAG_HIDE) !== 0;
        const pinned = (flags & FLAG_PINNED) !== 0;

        const id = nextId++;

        if (type === ObjectType.Party) {
            const hasPreset = (flags & PARTY_FLAG_PRESET) !== 0;
            let image = '';
            let name = '';
            if (hasPreset) {
                const presetIndex = reader.readUVar();
                const preset = PARTY_PRESETS[presetIndex];
                if (preset) {
                    image = preset.image;
                    name = preset.name;
                }
            } else {
                image = readStringIndex(reader, table);
                name = readStringIndex(reader, table);
            }

            const x = readCoordX();
            const y = readCoordY();
            const rotation = flags & PARTY_FLAG_ROTATION ? reader.readSVar() : 0;
            const width = flags & PARTY_FLAG_SIZE ? reader.readUVar() : DEFAULT_PARTY_SIZE;
            const height = flags & PARTY_FLAG_SIZE ? reader.readUVar() : DEFAULT_PARTY_SIZE;
            const opacity = flags & PARTY_FLAG_OPACITY ? reader.readUVar() : DEFAULT_OPACITY_IMAGE;

            const party: PartyObject = {
                type,
                id,
                image,
                name,
                x,
                y,
                rotation,
                width,
                height,
                opacity,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return party;
        }

        if (type === ObjectType.Enemy) {
            const icon = readStringIndex(reader, table);
            const name = flags & ENEMY_FLAG_NAME ? readStringIndex(reader, table) : '';
            const color = readColor(reader);
            const radius = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const rotation = flags & ENEMY_FLAG_ROTATION ? reader.readSVar() : 0;
            const opacity = flags & ENEMY_FLAG_OPACITY ? reader.readUVar() : DEFAULT_OPACITY_ENEMY;
            const ring =
                (flags & ENEMY_FLAG_RING) === 0
                    ? EnemyRingStyle.Directional
                    : (() => {
                          const code = reader.readU8();
                          return code === 0
                              ? EnemyRingStyle.NoDirection
                              : code === 2
                                ? EnemyRingStyle.Omnidirectional
                                : EnemyRingStyle.Directional;
                      })();

            const enemy: EnemyObject = {
                type,
                id,
                icon,
                name,
                color,
                radius,
                x,
                y,
                rotation,
                opacity,
                ring,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return enemy;
        }

        if (type === ObjectType.Text) {
            const text = readStringIndex(reader, table);
            const x = readCoordX();
            const y = readCoordY();

            const style =
                (flags & TEXT_FLAG_STYLE) === 0
                    ? DEFAULT_TEXT_STYLE
                    : (() => {
                          const code = reader.readU8();
                          return code === 1 ? 'shadow' : code === 2 ? 'plain' : 'outline';
                      })();
            const align = flags & TEXT_FLAG_ALIGN ? readStringIndex(reader, table) : DEFAULT_TEXT_ALIGN;
            const fontSize = flags & TEXT_FLAG_FONT_SIZE ? reader.readUVar() : DEFAULT_TEXT_FONT_SIZE;
            const color = flags & TEXT_FLAG_COLOR ? readColor(reader) : DEFAULT_TEXT_COLOR;
            const opacity = flags & TEXT_FLAG_OPACITY ? reader.readUVar() : DEFAULT_OPACITY_TEXT;
            const rotation = flags & TEXT_FLAG_ROTATION ? reader.readSVar() : 0;
            const stroke = flags & TEXT_FLAG_STROKE ? readColor(reader) : DEFAULT_TEXT_STROKE;

            const textObject: TextObject = {
                type,
                id,
                text,
                x,
                y,
                style,
                align,
                fontSize,
                color,
                opacity,
                rotation,
                stroke,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return textObject;
        }

        if (type === ObjectType.Tether) {
            const start = reader.readUVar();
            const end = reader.readUVar();
            const tetherCode = flags & TETHER_FLAG_TYPE ? reader.readU8() : 0;
            const tetherType =
                tetherCode === 1
                    ? TetherType.Close
                    : tetherCode === 2
                      ? TetherType.Far
                      : tetherCode === 3
                        ? TetherType.MinusMinus
                        : tetherCode === 4
                          ? TetherType.PlusMinus
                          : tetherCode === 5
                            ? TetherType.PlusPlus
                            : TetherType.Line;

            const width = flags & TETHER_FLAG_WIDTH ? reader.readUVar() : DEFAULT_TETHER_WIDTH;
            const opacity = flags & TETHER_FLAG_OPACITY ? reader.readUVar() : DEFAULT_OPACITY_TETHER;
            const color = flags & TETHER_FLAG_COLOR ? readColor(reader) : getDefaultTetherColor(tetherType);

            const tetherObj: Omit<Tether, 'startId' | 'endId'> = {
                type,
                id,
                tether: tetherType,
                width,
                opacity,
                color,
                ...(hide ? { hide } : {}),
            };
            return { __tether: true, start, end, data: tetherObj };
        }

        if (type === ObjectType.Marker) {
            const image = readStringIndex(reader, table);
            const name = readStringIndex(reader, table);
            const x = readCoordX();
            const y = readCoordY();
            const width = reader.readUVar();
            const height = reader.readUVar();
            const rotation = reader.readSVar();
            const shape = flags & MARKER_FLAG_SHAPE ? (reader.readU8() === 1 ? 'square' : 'circle') : DEFAULT_MARKER_SHAPE;
            const color = readColor(reader);
            const opacity = flags & MARKER_FLAG_OPACITY ? reader.readUVar() : DEFAULT_OPACITY_IMAGE;

            const marker: MarkerObject = {
                type,
                id,
                image,
                name,
                x,
                y,
                width,
                height,
                rotation,
                shape,
                color,
                opacity,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return marker;
        }

        if (type === ObjectType.Icon) {
            const image = readStringIndex(reader, table);
            const name = readStringIndex(reader, table);
            const x = readCoordX();
            const y = readCoordY();
            const width = flags & IMAGE_FLAG_SIZE ? reader.readUVar() : DEFAULT_PARTY_SIZE;
            const height = flags & IMAGE_FLAG_SIZE ? reader.readUVar() : DEFAULT_PARTY_SIZE;
            const rotation = flags & IMAGE_FLAG_ROTATION ? reader.readSVar() : 0;
            const opacity = flags & IMAGE_FLAG_OPACITY ? reader.readUVar() : DEFAULT_OPACITY_IMAGE;

            const iconId = flags & 0x10 ? reader.readUVar() : undefined;
            const maxStacks = flags & 0x20 ? reader.readUVar() : undefined;
            const time = flags & 0x40 ? reader.readUVar() : undefined;

            const iconObject: IconObject = {
                type,
                id,
                image,
                name,
                x,
                y,
                width,
                height,
                rotation,
                opacity,
                iconId,
                maxStacks,
                time,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return iconObject;
        }

        if (type === ObjectType.Arrow) {
            const color = readColor(reader);
            const width = reader.readUVar();
            const height = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const rotation = flags & ARROW_FLAG_ROTATION ? reader.readSVar() : 0;
            const opacity = flags & ARROW_FLAG_OPACITY ? reader.readUVar() : DEFAULT_OPACITY_IMAGE;

            const arrowObject: ArrowObject = {
                type,
                id,
                color,
                width,
                height,
                x,
                y,
                rotation,
                opacity,
                ...(flags & ARROW_FLAG_END ? { arrowEnd: true } : {}),
                ...(flags & ARROW_FLAG_BEGIN ? { arrowBegin: true } : {}),
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return arrowObject;
        }

        if (type === ObjectType.Draw) {
            const color = readColor(reader);
            const x = reader.readF32();
            const y = reader.readF32();
            const width = reader.readF32();
            const height = reader.readF32();
            const rotation = flags & 0x02 ? reader.readF32() : 0;
            const pointsLen = reader.readUVar();
            const points: number[] = [];
            for (let i = 0; i < pointsLen; i++) points.push(reader.readF32());
            const brushSize = reader.readUVar();
            const opacity = flags & 0x01 ? reader.readUVar() : DEFAULT_OPACITY_IMAGE;

            const drawObject: DrawObject = {
                type,
                id,
                color,
                x,
                y,
                width,
                height,
                rotation,
                points,
                brushSize,
                opacity,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return drawObject;
        }

        const defaultOpacity = getDefaultOpacity(type);
        const zoneFlags = flags;
        const hollow = (zoneFlags & ZONE_FLAG_HOLLOW) !== 0;

        if (
            type === ObjectType.Circle ||
            type === ObjectType.Proximity ||
            type === ObjectType.Knockback ||
            type === ObjectType.RotateCW ||
            type === ObjectType.RotateCCW
        ) {
            const color = readColor(reader);
            const radius = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            const zone: CircleZone = {
                type,
                id,
                color,
                radius,
                x,
                y,
                opacity,
                ...(hollow ? { hollow: true } : {}),
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return zone;
        }

        if (type === ObjectType.Donut) {
            const color = readColor(reader);
            const radius = reader.readUVar();
            const innerRadius = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            const donut: DonutZone = {
                type,
                id,
                color,
                radius,
                innerRadius,
                x,
                y,
                opacity,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return donut;
        }

        if (type === ObjectType.Eye) {
            const invert = reader.readU8() === 1;
            const color = readColor(reader);
            const radius = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            const eye: EyeObject = {
                type,
                id,
                color,
                radius,
                x,
                y,
                opacity,
                ...(hollow ? { hollow: true } : {}),
                ...(invert ? { invert: true } : {}),
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return eye;
        }

        if (type === ObjectType.Stack || type === ObjectType.Tower) {
            const color = readColor(reader);
            const radius = reader.readUVar();
            const count = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            if (type === ObjectType.Stack) {
                const stack: StackZone = {
                    type,
                    id,
                    color,
                    radius,
                    count,
                    x,
                    y,
                    opacity,
                    ...(hollow ? { hollow: true } : {}),
                    ...(hide ? { hide } : {}),
                    ...(pinned ? { pinned } : {}),
                };
                return stack;
            }
            const tower: TowerZone = {
                type,
                id,
                color,
                radius,
                count,
                x,
                y,
                opacity,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return tower;
        }

        if (type === ObjectType.Line) {
            const color = readColor(reader);
            const length = reader.readUVar();
            const width = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const rotation = readZoneRotation(zoneFlags);
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            const line: LineZone = {
                type,
                id,
                color,
                length,
                width,
                x,
                y,
                rotation,
                opacity,
                ...(hollow ? { hollow: true } : {}),
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return line;
        }

        if (type === ObjectType.Cone) {
            const color = readColor(reader);
            const radius = reader.readUVar();
            const coneAngle = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const rotation = readZoneRotation(zoneFlags);
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            const cone: ConeZone = {
                type,
                id,
                color,
                radius,
                coneAngle,
                x,
                y,
                rotation,
                opacity,
                ...(hollow ? { hollow: true } : {}),
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return cone;
        }

        if (type === ObjectType.Arc) {
            const color = readColor(reader);
            const radius = reader.readUVar();
            const innerRadius = reader.readUVar();
            const coneAngle = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const rotation = readZoneRotation(zoneFlags);
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            const arc: ArcZone = {
                type,
                id,
                color,
                radius,
                innerRadius,
                coneAngle,
                x,
                y,
                rotation,
                opacity,
                ...(hollow ? { hollow: true } : {}),
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return arc;
        }

        if (
            type === ObjectType.Rect ||
            type === ObjectType.LineStack ||
            type === ObjectType.LineKnockback ||
            type === ObjectType.LineKnockAway ||
            type === ObjectType.Triangle ||
            type === ObjectType.RightTriangle
        ) {
            const color = readColor(reader);
            const width = reader.readUVar();
            const height = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const rotation = readZoneRotation(zoneFlags);
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            const rect: RectangleZone = {
                type,
                id,
                color,
                width,
                height,
                x,
                y,
                rotation,
                opacity,
                ...(hollow ? { hollow: true } : {}),
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return rect;
        }

        if (type === ObjectType.Polygon) {
            const orientCode = reader.readU8();
            const color = readColor(reader);
            const radius = reader.readUVar();
            const sides = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const rotation = readZoneRotation(zoneFlags);
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            const poly: PolygonZone = {
                type,
                id,
                orient: orientCode === 1 ? 'side' : 'point',
                color,
                radius,
                sides,
                x,
                y,
                rotation,
                opacity,
                ...(hollow ? { hollow: true } : {}),
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return poly;
        }

        if (type === ObjectType.Exaflare) {
            const color = readColor(reader);
            const radius = reader.readUVar();
            const length = reader.readUVar();
            const spacing = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const rotation = readZoneRotation(zoneFlags);
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            const exaflare: ExaflareZone = {
                type,
                id,
                color,
                radius,
                length,
                spacing,
                x,
                y,
                rotation,
                opacity,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return exaflare;
        }

        if (type === ObjectType.Starburst) {
            const color = readColor(reader);
            const radius = reader.readUVar();
            const spokes = reader.readUVar();
            const spokeWidth = reader.readUVar();
            const x = readCoordX();
            const y = readCoordY();
            const rotation = readZoneRotation(zoneFlags);
            const opacity = readZoneOpacity(zoneFlags, defaultOpacity);
            const starburst: StarburstZone = {
                type,
                id,
                color,
                radius,
                spokes,
                spokeWidth,
                x,
                y,
                rotation,
                opacity,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return starburst;
        }

        if (type === ObjectType.Cursor) {
            const x = readCoordX();
            const y = readCoordY();
            const opacity = readZoneOpacity(flags, getDefaultOpacity(type));
            const cursor: FakeCursorObject = {
                type,
                id,
                x,
                y,
                opacity,
                ...(hide ? { hide } : {}),
                ...(pinned ? { pinned } : {}),
            };
            return cursor;
        }

        throw new Error(`Unsupported object type: "${type}"`);
    };

    const resolveTethers = (objects: readonly (SceneObject | TetherPlaceholder)[]): SceneObject[] => {
        const idsByIndex = objects.map((o) => ('__tether' in o ? o.data.id : o.id));
        return objects.map((o) => {
            if ('__tether' in o) {
                const startId = idsByIndex[o.start] ?? idsByIndex[0] ?? 1;
                const endId = idsByIndex[o.end] ?? idsByIndex[0] ?? 1;
                const tether: Tether = { ...o.data, startId, endId };
                return tether;
            }
            return o;
        });
    };

    const cloneSceneObjectWithNewId = (obj: SceneObject, id: number): SceneObject => {
        if (obj.type === ObjectType.Draw) {
            const draw = obj as DrawObject;
            return { ...draw, id, points: [...draw.points] } as DrawObject;
        }
        return { ...obj, id };
    };

    let prevResolvedObjects: SceneObject[] | undefined;
    let prevIdToIndex: Map<number, number> | undefined;

    for (let stepIndex = 0; stepIndex < stepsCount; stepIndex++) {
        const stepMode = version >= CODEC_VERSION_V3 ? reader.readU8() : 0;
        const objectCount = reader.readUVar();

        const objects: (SceneObject | TetherPlaceholder)[] = [];

        if (version < CODEC_VERSION_V3 || stepMode === 0) {
            for (let objectIndex = 0; objectIndex < objectCount; objectIndex++) {
                objects.push(readObject());
            }
        } else if (stepMode === 1) {
            if (!prevResolvedObjects || !prevIdToIndex) {
                throw new Error('Invalid delta step (missing previous step)');
            }

            let objectIndex = 0;
            while (objectIndex < objectCount) {
                const command = reader.readU8();
                if (command === 0) {
                    const runLen = reader.readUVar();
                    if (runLen <= 0 || objectIndex + runLen > objectCount) {
                        throw new Error('Invalid delta copy run length');
                    }

                    for (let j = 0; j < runLen; j++) {
                        const prev = prevResolvedObjects[objectIndex + j];
                        if (!prev) {
                            throw new Error('Invalid delta copy (out of range)');
                        }

                        const id = nextId++;
                        if (prev.type === ObjectType.Tether) {
                            const prevTether = prev as Tether;
                            const start = prevIdToIndex.get(prevTether.startId) ?? 0;
                            const end = prevIdToIndex.get(prevTether.endId) ?? 0;
                            const tetherData: Omit<Tether, 'startId' | 'endId'> = {
                                type: ObjectType.Tether,
                                id,
                                tether: prevTether.tether,
                                width: prevTether.width,
                                opacity: prevTether.opacity,
                                color: prevTether.color,
                                ...(prevTether.hide ? { hide: true } : {}),
                            };
                            objects.push({ __tether: true, start, end, data: tetherData });
                        } else {
                            objects.push(cloneSceneObjectWithNewId(prev, id));
                        }
                    }

                    objectIndex += runLen;
                    continue;
                }

                if (command === 1) {
                    objects.push(readObject());
                    objectIndex++;
                    continue;
                }

                throw new Error('Invalid delta step command');
            }
        } else {
            throw new Error('Invalid step mode');
        }

        const resolvedObjects = resolveTethers(objects);
        steps.push({ objects: resolvedObjects });

        prevResolvedObjects = resolvedObjects;
        prevIdToIndex = new Map<number, number>(resolvedObjects.map((o, i) => [o.id, i]));
    }

    return {
        nextId,
        arena,
        steps,
    };
}
