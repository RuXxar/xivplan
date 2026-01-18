import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    Field,
    Radio,
    RadioGroup,
    Textarea,
    Toast,
    ToastTitle,
    makeStyles,
    useToastController,
} from '@fluentui/react-components';
import { CopyRegular, ShareRegular } from '@fluentui/react-icons';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { CollapsableToolbarButton } from '../CollapsableToolbarButton';
import { HotkeyBlockingDialogBody } from '../HotkeyBlockingDialogBody';
import { useScene } from '../SceneProvider';
import { Scene, SceneStep } from '../scene';
import { DownloadButton } from './DownloadButton';
import { createHostedShareLink, getShareLink } from './share';

export interface ShareDialogButtonProps {
    children?: ReactNode | undefined;
}

export const ShareDialogButton: React.FC<ShareDialogButtonProps> = ({ children }) => {
    return (
        <Dialog>
            <DialogTrigger>
                <CollapsableToolbarButton icon={<ShareRegular />}>{children}</CollapsableToolbarButton>
            </DialogTrigger>

            <DialogSurface>
                <ShareDialogBody />
            </DialogSurface>
        </Dialog>
    );
};

type ShareMode = 'step' | 'full' | 'hosted';

const ShareDialogBody: React.FC = () => {
    const classes = useStyles();
    const { canonicalScene, stepIndex } = useScene();
    const { dispatchToast } = useToastController();
    const [mode, setMode] = useState<ShareMode>('full');
    const [hostedUrl, setHostedUrl] = useState<string>('');
    const [hostedError, setHostedError] = useState<string | undefined>(undefined);
    const [isCreatingHosted, setIsCreatingHosted] = useState(false);

    const { fullUrl, stepUrl } = useMemo(() => {
        const step = canonicalScene.steps[stepIndex] ?? canonicalScene.steps[0];
        const stepScene = step ? sceneWithOnlyStep(canonicalScene, step) : canonicalScene;

        return {
            fullUrl: getShareLink(canonicalScene),
            stepUrl: getShareLink(stepScene),
        };
    }, [canonicalScene, stepIndex]);

    const url = mode === 'full' ? fullUrl : stepUrl;

    useEffect(() => {
        setHostedUrl('');
        setHostedError(undefined);
    }, [fullUrl]);

    const createHosted = async () => {
        setIsCreatingHosted(true);
        setHostedError(undefined);
        try {
            const link = await createHostedShareLink(canonicalScene);
            setHostedUrl(link);
            dispatchToast(
                <Toast>
                    <ToastTitle>Short link created</ToastTitle>
                </Toast>,
                { intent: 'success' },
            );
        } catch (ex) {
            console.error('Failed to create hosted share link', ex);
            setHostedError(ex instanceof Error ? ex.message : String(ex));
        } finally {
            setIsCreatingHosted(false);
        }
    };

    const copyToClipboard = async () => {
        const value = mode === 'hosted' ? hostedUrl : url;
        if (!value) return;
        await navigator.clipboard.writeText(value);
        dispatchToast(<CopySuccessToast />, { intent: 'success' });
    };

    return (
        <HotkeyBlockingDialogBody>
            <DialogTitle>Share</DialogTitle>
            <DialogContent>
                <Field label="Share">
                    <RadioGroup
                        className={classes.shareModes}
                        value={mode}
                        onChange={(_, data) => setMode(data.value as ShareMode)}
                    >
                        <Radio value="full" label="Full plan (Discord-friendly)" />
                        <Radio value="step" label="Current step (extra short)" />
                        <Radio value="hosted" label="Hosted short link (requires internet)" />
                    </RadioGroup>
                </Field>

                <Field
                    label="Link to this plan"
                    validationState={mode === 'hosted' && hostedError ? 'error' : 'none'}
                    validationMessage={mode === 'hosted' ? hostedError : undefined}
                >
                    <Textarea
                        value={mode === 'hosted' ? hostedUrl : url}
                        contentEditable={false}
                        appearance="filled-darker"
                        rows={6}
                    />
                </Field>
                <p>
                    If your browser won&apos;t open the link, paste the text into{' '}
                    <strong>Open &gt; Import Plan Link</strong> instead, or download the plan and drag and drop the file
                    onto the page to open it.
                </p>
            </DialogContent>
            <DialogActions fluid className={classes.actions}>
                <DownloadButton appearance="primary" className={classes.download} />

                {mode === 'hosted' && (
                    <Button appearance="primary" disabled={isCreatingHosted} onClick={createHosted}>
                        {hostedUrl ? 'Refresh short link' : 'Create short link'}
                    </Button>
                )}

                <Button
                    appearance="primary"
                    icon={<CopyRegular />}
                    disabled={mode === 'hosted' ? !hostedUrl : !url}
                    onClick={copyToClipboard}
                >
                    Copy to clipboard
                </Button>

                <DialogTrigger disableButtonEnhancement>
                    <Button>Close</Button>
                </DialogTrigger>
            </DialogActions>
        </HotkeyBlockingDialogBody>
    );
};

const CopySuccessToast = () => {
    return (
        <Toast>
            <ToastTitle>Link copied</ToastTitle>
        </Toast>
    );
};

function sceneWithOnlyStep(scene: Scene, step: SceneStep): Scene {
    let maxId = 0;
    for (const object of step.objects) {
        if (object.id > maxId) {
            maxId = object.id;
        }
    }

    return {
        ...scene,
        nextId: maxId + 1,
        steps: [step],
    };
}

const useStyles = makeStyles({
    actions: {
        width: '100%',
    },
    download: {
        marginRight: 'auto',
    },
    shareModes: {
        display: 'flex',
        flexFlow: 'column',
    },
});
