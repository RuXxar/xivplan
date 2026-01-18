import { use, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { jsonToScene, sceneToText, textToScene } from '../file';
import { Scene } from '../scene';

export function getShareLink(scene: Scene): string {
    const data = sceneToText(scene);
    const path = location.pathname === '/' ? '' : location.pathname;
    return `${location.protocol}//${location.host}${path}#${data}`;
}

const HOSTED_PLAN_PREFIX = '#s/';

export function getHostedShareLink(id: string): string {
    const path = location.pathname === '/' ? '' : location.pathname;
    return `${location.protocol}//${location.host}${path}${HOSTED_PLAN_PREFIX}${encodeURIComponent(id)}`;
}

export async function createHostedShareLink(scene: Scene): Promise<string> {
    const data = sceneToText(scene);

    const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data }),
    });

    if (!response.ok) {
        throw new Error(`Failed to create hosted link: ${response.status}`);
    }

    const body = (await response.json()) as { id?: string };
    if (!body.id || typeof body.id !== 'string') {
        throw new Error('Invalid response from share API');
    }

    return getHostedShareLink(body.id);
}

const PLAN_PREFIX = '#/plan/';
const SHORT_PLAN_PREFIX = '#~';

function getPlanData(hash: string, searchParams?: URLSearchParams): string | undefined {
    // Current share links are formatted as /#/plan/<data>
    if (hash.startsWith(PLAN_PREFIX)) {
        return decodeURIComponent(hash.substring(PLAN_PREFIX.length));
    }

    // New share links are formatted as /#<data> (currently they always start with "~" for encoding versioning)
    if (hash.startsWith(SHORT_PLAN_PREFIX)) {
        return decodeURIComponent(hash.substring(1));
    }

    // Previously, links were formatted as /?plan=<data> or /?path=<data>
    const data = searchParams?.get('plan') ?? searchParams?.get('path');
    if (data) {
        return data;
    }

    return undefined;
}

function getHostedPlanId(hash: string): string | undefined {
    if (hash.startsWith(HOSTED_PLAN_PREFIX)) {
        return decodeURIComponent(hash.substring(HOSTED_PLAN_PREFIX.length));
    }
    return undefined;
}

export function parseSceneLink(url: URL): Scene | undefined;
export function parseSceneLink(hash: string, searchParams: URLSearchParams): Scene | undefined;
export function parseSceneLink(hash: string | URL, searchParams?: URLSearchParams): Scene | undefined {
    if (hash instanceof URL) {
        return parseSceneLink(hash.hash, hash.searchParams);
    }

    const data = getPlanData(hash, searchParams);
    if (data) {
        return textToScene(data);
    }

    return undefined;
}

export async function fetchScene(url: string) {
    const response = await fetch(url);
    const data = await response.text();

    return jsonToScene(data);
}

async function fetchHostedScene(id: string): Promise<Scene> {
    const response = await fetch(`/api/share/${encodeURIComponent(id)}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch hosted plan: ${response.status}`);
    }
    const data = await response.text();
    return textToScene(data);
}

let urlCache = '';
let scenePromise: Promise<Scene | undefined> | undefined;
let sceneError: Error | string | unknown | undefined;

function getFetchScenePromise(url: string): Promise<Scene | undefined> {
    if (url === urlCache && scenePromise) {
        return scenePromise;
    }

    urlCache = url;
    scenePromise = fetchScene(url).catch((ex) => {
        console.error(`Failed to read plan from "${url}"`, ex);
        sceneError = ex;

        return undefined;
    });

    return scenePromise;
}

let hostedIdCache = '';
let hostedPromise: Promise<Scene | undefined> | undefined;

function getFetchHostedScenePromise(id: string): Promise<Scene | undefined> {
    if (id === hostedIdCache && hostedPromise) {
        return hostedPromise;
    }

    hostedIdCache = id;
    hostedPromise = fetchHostedScene(id).catch((ex) => {
        console.error(`Failed to read hosted plan "${id}"`, ex);
        sceneError = ex;
        return undefined;
    });

    return hostedPromise;
}

/**
 * Reads a plan's scene data from the URL. If this requires fetching data from an external site, it suspends until the
 * data is fetched.
 */
export function useSceneFromUrl(): Scene | undefined {
    const [searchParams] = useSearchParams();
    const { hash } = useLocation();

    let scene: Scene | undefined;
    let error: unknown | undefined;

    try {
        scene = parseSceneLink(hash, searchParams);
    } catch (ex) {
        console.error('Invalid plan data from URL', ex);
        error = ex;
    }

    useEffect(() => {
        sceneError = error;
    }, [error]);

    if (scene) {
        return scene;
    }

    const hostedId = getHostedPlanId(hash);
    if (hostedId) {
        return use(getFetchHostedScenePromise(hostedId));
    }

    const url = searchParams.get('url');
    if (url) {
        return use(getFetchScenePromise(url));
    }

    return undefined;
}

export function useSceneLoadError(): Error | string | unknown | undefined {
    return sceneError;
}
