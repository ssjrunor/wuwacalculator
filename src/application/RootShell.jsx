import React, { useEffect, useState } from 'react';
import PlainModal from '@shared/ui/common/PlainModal.jsx';
import CookieNotice from '@shared/ui/common/CookieNotice.jsx';
import DailyNoticeModal from '@shared/ui/common/DailyNoticeModal.jsx';
import { DotArtGallery, TrollButtonsLayer } from '@shared/constants/trolling.jsx';

const DAILY_NOTICE_STORAGE_KEY = 'dailyNoticeAcknowledgedOn';

function getTodayStorageKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function RootShell({ children, showCookieNotice, onCloseCookieNotice }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [dailyNoticeOpen, setDailyNoticeOpen] = useState(false);

    useEffect(() => {
        try {
            const lastAcknowledgedOn = localStorage.getItem(DAILY_NOTICE_STORAGE_KEY);
            if (lastAcknowledgedOn !== getTodayStorageKey()) {
                setDailyNoticeOpen(true);
            }
        } catch (error) {
            console.warn('Failed to read daily notice state:', error);
            setDailyNoticeOpen(true);
        }
    }, []);

    const handleConfirmDailyNotice = () => {
        try {
            localStorage.setItem(DAILY_NOTICE_STORAGE_KEY, getTodayStorageKey());
        } catch (error) {
            console.warn('Failed to persist daily notice state:', error);
        }

        setDailyNoticeOpen(false);
    };

    return (
        <>
            {children}

            <TrollButtonsLayer setModalOpen={setModalOpen} count={5} />

            <PlainModal modalOpen={modalOpen} setModalOpen={setModalOpen}>
                <DotArtGallery modalOpen={modalOpen} />
                <h3 style={{ margin: 'unset' }}>aLsO!!.</h3>
                <p style={{ margin: 'unset' }}>
                    In case you were not aware, there&apos;s a discord server for this.{` `}
                    <a href="https://discord.gg/wNaauhE4uH" target="_blank" rel="noopener noreferrer">
                        Join~
                    </a>
                </p>
            </PlainModal>

            {showCookieNotice && <CookieNotice onClose={onCloseCookieNotice} />}
            <DailyNoticeModal
                open={dailyNoticeOpen}
                onConfirm={handleConfirmDailyNotice}
                message={
                    <>
                        <p style={{ marginTop: 0 }}>
                            A newer version of the app is now deployed. Please use{' '}
                            <a href="https://thewuwacalculator.com" target="_blank" rel="noopener noreferrer">
                                thewuwacalculator.com
                            </a>{' '}
                            instead.
                        </p>
                        <p>
                            This version will still be supported for a little while, but not for too much longer.
                        </p>
                        <p style={{ marginBottom: 0 }}>
                            Export your app data from Settings in this app, then import it into the new app so you can
                            keep your builds, setups, and some progress.
                        </p>

                        <p>
                            Sorry for any inconvenience this might cause (ᵕ—ᴗ—), and thanks for using the app~!
                        </p>
                    </>
                }
            />
        </>
    );
}
