import { useLocation } from 'react-router-dom';
import { useMedia } from 'react-use';

// Use a viewport-based signal rather than input-device heuristics (hover/pointer),
// since those can be inconsistent across phones (e.g. stylus devices) and prevent
// testing in a narrow desktop window.
export const MOBILE_VIEW_MEDIA_QUERY = '(max-width: 900px), (max-height: 600px)';

function getMobileViewOverride(search: string): boolean | undefined {
    const params = new URLSearchParams(search);

    // `?view=mobile` or `?mobile=1` forces compact view.
    if (params.get('view') === 'mobile' || params.get('mobile') === '1') {
        return true;
    }

    // `?view=desktop` forces the full editor view.
    if (params.get('view') === 'desktop') {
        return false;
    }

    return undefined;
}

export function useIsMobileView(): boolean {
    const { search } = useLocation();
    const matchesViewport = useMedia(MOBILE_VIEW_MEDIA_QUERY);
    const override = getMobileViewOverride(search);

    return override ?? matchesViewport;
}
