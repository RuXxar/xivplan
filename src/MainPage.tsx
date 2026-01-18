import { makeStyles, tokens } from '@fluentui/react-components';
import React from 'react';
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
                <SceneRenderer readOnly={isMobileView} />
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
        },
    },
});
