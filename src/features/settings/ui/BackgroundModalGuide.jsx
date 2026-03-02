import React from 'react';

function aLittleTrolling({ clickCounter, setClickCounter, setShowToast, toggleBlurMode, setPopupMessage, showToast }) {
    if (showToast) setShowToast(false);

    setTimeout(() => {
        if (clickCounter <= 4) {
            switch (clickCounter) {
                case 0:
                    setPopupMessage({
                        message: 'Oh did you click "a" button? hmm??',
                        icon: '',
                        color: { light: 'green', dark: 'limegreen' },
                        duration: 10000,
                        prompt: {
                            message: 'an enticing link~',
                            action: () => window.open('https://youtu.be/oPLObjVAvIU?si=xO8gapHdLmygFvUG', '_blank'),
                        },
                        onClose: () => setTimeout(() => setShowToast(false), 300),
                    });
                    setShowToast(true);
                    setClickCounter((previous) => previous + 1);
                    break;
                case 1:
                    setPopupMessage({
                        message: 'Again...? hmm...',
                        icon: '',
                        color: { light: 'green', dark: 'limegreen' },
                        duration: 10000,
                        prompt: {
                            message: "it's a link to something",
                            action: () => window.open('https://youtu.be/oPLObjVAvIU?si=xO8gapHdLmygFvUG', '_blank'),
                        },
                        onClose: () => setTimeout(() => setShowToast(false), 300),
                    });
                    setShowToast(true);
                    setClickCounter((previous) => previous + 1);
                    break;
                case 2:
                    setPopupMessage({
                        message: 'yeah just click the link...',
                        icon: '',
                        color: { light: 'green', dark: 'limegreen' },
                        duration: 10000,
                        prompt: {
                            message: 'link',
                            action: () => window.open('https://youtu.be/oPLObjVAvIU?si=xO8gapHdLmygFvUG', '_blank'),
                        },
                        onClose: () => setTimeout(() => setShowToast(false), 300),
                    });
                    setShowToast(true);
                    setClickCounter((previous) => previous + 1);
                    break;
                case 3:
                    setPopupMessage({
                        message: 'why...',
                        icon: '',
                        color: { light: 'green', dark: 'limegreen' },
                        duration: 10000,
                        prompt: {
                            message: 'you WILL be rick-rolled',
                            action: () => window.open('https://youtu.be/oPLObjVAvIU?si=xO8gapHdLmygFvUG', '_blank'),
                        },
                        onClose: () => setTimeout(() => setShowToast(false), 300),
                    });
                    setShowToast(true);
                    setClickCounter((previous) => previous + 1);
                    break;
                case 4:
                    setPopupMessage({
                        message: 'you win, just toggle it already',
                        icon: '',
                        color: { light: 'green', dark: 'limegreen' },
                        duration: 10000,
                        prompt: {
                            message: 'toggle',
                            action: toggleBlurMode,
                        },
                        onClose: () => setTimeout(() => setShowToast(false), 300),
                    });
                    setShowToast(true);
                    setClickCounter((previous) => previous + 1);
                    break;
                default:
                    break;
            }
        } else if (clickCounter > 4 && clickCounter <= 7) {
            setPopupMessage({
                message: 'toggle blur effect',
                icon: '',
                color: { light: 'green', dark: 'limegreen' },
                duration: 10000,
                prompt: {
                    message: 'toggle',
                    action: toggleBlurMode,
                },
                onClose: () => setTimeout(() => setShowToast(false), 300),
            });
            setShowToast(true);
            setClickCounter((previous) => previous + 1);
        } else {
            setPopupMessage({
                message: "Ok i'm taking away the button",
                icon: '',
                color: { light: 'green', dark: 'limegreen' },
                duration: 10000,
            });
            setShowToast(true);
            setTimeout(() => {
                setClickCounter((previous) => previous + 1);
            }, 2000);
        }
    }, showToast ? 500 : 0);
}

export default function BackgroundModalGuide({
    blurMode,
    clickCounter,
    setClickCounter,
    setShowToast,
    toggleBlurMode,
    setPopupMessage,
    showToast,
}) {
    return (
        <>
            <h2 style={{ margin: 'unset' }}>About Background Themes</h2>
            <p style={{ lineHeight: 1.6, margin: 'unset' }}>
                Background themes use Frosted or blurred elements for most things on here which in turn use a real-time
                effect called
                <strong> BACKDROP FILTERING</strong>. It looks smooth and glassy but can be demanding on your GPU,
                especially when large images or multiple translucent layers are involved.
            </p>

            <p style={{ lineHeight: 1.6, margin: 'unset' }}>
                If your device feels slow, turn off blur or try switching to a simpler theme in the Appearance
                settings. You&apos;ll get much faster animations and reduced memory usage with almost the same visual
                quality (just no custom background).
            </p>

            <p style={{ lineHeight: 1.6, opacity: 0.7, margin: 'unset' }}>
                *Technical note:* Each time the screen updates, the browser must re-render and blur everything behind
                your frosted layer. On some systems, this can cause frame drops or increased fan noise.
            </p>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexDirection: 'column',
                    gap: '1rem',
                }}
            >
                <span className="highlight">
                    ❯❯❯❯ To turn <span style={{ color: 'red' }}>{blurMode === 'on' ? 'OFF' : 'ON'}</span> blur effect
                    on some surfaces and elements click "THE Button"
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    {clickCounter <= 8 && (
                        <button
                            className="clear-button"
                            onClick={() => {
                                aLittleTrolling({
                                    clickCounter,
                                    setClickCounter,
                                    setShowToast,
                                    toggleBlurMode,
                                    setPopupMessage,
                                    showToast,
                                });
                            }}
                            style={{ margin: 'unset' }}
                        >
                            a button
                        </button>
                    )}
                    <button
                        className="clear-button"
                        onClick={() => {
                            toggleBlurMode();
                            if (clickCounter > 8) {
                                setPopupMessage({
                                    message: 'ok you get get the funny button back',
                                    icon: '',
                                    color: { light: 'green', dark: 'limegreen' },
                                    duration: 10000,
                                });
                                setShowToast(true);
                                setTimeout(() => {
                                    setClickCounter(0);
                                }, 2000);
                            }
                        }}
                        style={{ margin: 'unset' }}
                    >
                        THE Button
                    </button>
                </div>
            </div>
        </>
    );
}
