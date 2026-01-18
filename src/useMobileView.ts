import { useMedia } from 'react-use';

export const MOBILE_VIEW_MEDIA_QUERY = '(max-width: 900px) and (hover: none) and (pointer: coarse)';

export function useIsMobileView(): boolean {
    return useMedia(MOBILE_VIEW_MEDIA_QUERY);
}
