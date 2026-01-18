type Env = {
    readonly PLANS: KVNamespace;
    readonly PLAN_TTL_SECONDS?: string;
};

type ShareRequest = {
    readonly data: string;
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
        headers: {
            'content-type': 'application/json; charset=utf-8',
            ...(init?.headers ?? {}),
        },
        ...init,
    });
}

function base64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Base64UrlTrunc(data: Uint8Array, bytesToKeep: number): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64Url(new Uint8Array(digest).subarray(0, bytesToKeep));
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
    let body: ShareRequest;
    try {
        body = (await request.json()) as ShareRequest;
    } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const data = body?.data;
    if (typeof data !== 'string' || data.length === 0) {
        return jsonResponse({ error: 'Missing plan data' }, { status: 400 });
    }

    // Safety limits: keep storage bounded and prevent abuse.
    if (data.length > 50_000) {
        return jsonResponse({ error: 'Plan data too large' }, { status: 413 });
    }

    // Current encodings always start with "~" (deflate) or "~~" (brotli+binary).
    if (!data.startsWith('~')) {
        return jsonResponse({ error: 'Invalid plan encoding' }, { status: 400 });
    }

    const id = await sha256Base64UrlTrunc(new TextEncoder().encode(data), 12);

    const existing = await env.PLANS.get(id);
    if (existing !== null) {
        return jsonResponse({ id });
    }

    const ttlRaw = env.PLAN_TTL_SECONDS;
    const ttl = ttlRaw ? Number.parseInt(ttlRaw, 10) : 60 * 60 * 24 * 365;
    const expirationTtl = Number.isFinite(ttl) && ttl > 0 ? ttl : undefined;

    await env.PLANS.put(id, data, expirationTtl ? { expirationTtl } : undefined);

    return jsonResponse({ id });
};
