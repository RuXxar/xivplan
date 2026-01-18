type Env = {
    readonly PLANS: KVNamespace;
};

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
    const id = params.id;
    if (typeof id !== 'string' || id.length === 0 || id.length > 64) {
        return new Response('Invalid id', { status: 400 });
    }

    const data = await env.PLANS.get(id, { cacheTtl: 3600 });
    if (data === null) {
        return new Response('Not found', { status: 404 });
    }

    return new Response(data, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=31536000, immutable',
        },
    });
};
