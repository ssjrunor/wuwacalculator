import React, { useState } from 'react';
import PlainModal from '@shared/ui/common/PlainModal.jsx';
import CookieNotice from '@shared/ui/common/CookieNotice.jsx';
import { DotArtGallery, TrollButtonsLayer } from '@shared/constants/trolling.jsx';

export default function RootShell({ children, showCookieNotice, onCloseCookieNotice }) {
    const [modalOpen, setModalOpen] = useState(false);

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
        </>
    );
}
