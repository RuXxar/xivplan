import { makeStyles, tokens } from '@fluentui/react-components';
import React, { useRef } from 'react';
import { EditModeProvider } from './EditModeProvider';
import { RegularHotkeyHandler } from './HotkeyHandler';
import { MainToolbar } from './MainToolbar';
import { PanelDragProvider } from './PanelDragProvider';
import { SceneLoadErrorNotifier } from './SceneLoadErrorNotifier';
import { useScene } from './SceneProvider';
import { SelectionProvider } from './SelectionProvider';
import { StepSelect } from './StepSelect';
import { DetailsPanel } from './panel/DetailsPanel';
import { MainPanel } from './panel/MainPanel';
import { SceneRenderer } from './render/SceneRenderer';
import { MIN_STAGE_WIDTH } from './theme';
import { MOBILE_VIEW_MEDIA_QUERY, useIsMobileView } from './useMobileView';
import { useIsDirty } from './useIsDirty';
import { removeFileExtension } from './util';

const MOBILE_VIEW_MEDIA = `@media ${MOBILE_VIEW_MEDIA_QUERY}`;

export const MainPage: React.FC = () => {
    return (
        <EditModeProvider>
            <SelectionProvider>
                <PanelDragProvider>
                    <MainPageContent />
                </PanelDragProvider>
            </SelectionProvider>
        </EditModeProvider>
    );
};

const MainPageContent: React.FC = () => {
    const classes = useStyles();
    const title = usePageTitle();
    const isMobileView = useIsMobileView();
    const { dispatch } = useScene();
    const swipeStart = useRef<{ pointerId: number; x: number; y: number } | null>(null);

    const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
        if (!isMobileView || e.pointerType !== 'touch') {
            return;
        }

        swipeStart.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerUpOrCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
        if (!isMobileView || e.pointerType !== 'touch') {
            return;
        }

        const start = swipeStart.current;
        if (!start || start.pointerId !== e.pointerId) {
            return;
        }

        swipeStart.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);

        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;

        const minSwipe = 50;
        const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.25;

        if (!isHorizontal || Math.abs(dx) < minSwipe) {
            return;
        }

        if (dx < 0) {
            dispatch({ type: 'nextStep' });
        } else {
            dispatch({ type: 'previousStep' });
        }
    };

    return (
        <>
            <title>{title}</title>

            <SceneLoadErrorNotifier />

            {!isMobileView && <RegularHotkeyHandler />}
            {!isMobileView && <MainToolbar />}

            {/* TODO: make panel collapsable */}
            {!isMobileView && <MainPanel />}

            <StepSelect readOnly={isMobileView} />

            <div className={classes.stage}>
                {isMobileView ? (
                    <div
                        className={classes.stageInner}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUpOrCancel}
                        onPointerCancel={handlePointerUpOrCancel}
                    >
                        <SceneRenderer readOnly />
                    </div>
                ) : (
                    <SceneRenderer />
                )}
            </div>

            {/* TODO: make panel collapsable */}
            {!isMobileView && <DetailsPanel />}
        </>
    );
};

const TITLE = 'XIVPlan';

function usePageTitle() {
    const { source } = useScene();
    const isDirty = useIsDirty();

    let title = TITLE;
    if (source) {
        title += ': ';
        title += removeFileExtension(source?.name);
    }
    if (isDirty) {
        title += ' ●';
    }
    return title;
}

const useStyles = makeStyles({
    stage: {
        gridArea: 'content',
        display: 'flex',
        flexFlow: 'row',
        justifyContent: 'center',
        overflow: 'auto',
        minWidth: MIN_STAGE_WIDTH,
        backgroundColor: tokens.colorNeutralBackground1,

        [MOBILE_VIEW_MEDIA]: {
            minWidth: '0',
            overflow: 'hidden',
        },
    },

    stageInner: {
        width: '100%',
        height: '100%',

        [MOBILE_VIEW_MEDIA]: {
            touchAction: 'none',
        },
    },
});
