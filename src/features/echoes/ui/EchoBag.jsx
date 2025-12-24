import {imageCache} from "@/pages/Calculator.jsx";
import { setIconMap } from "@/constants/echoSetData2.js";
import {removeEchoFromBag} from "@/state/echoBagStore.js";
import {X} from "lucide-react";
import {formatStatKey, statIconMap} from "@/utils/echoHelper.js";
import {ExpandableEchoSection} from "@/components/common/Expandable.jsx";
import React, {useEffect, useState} from "react";
import {EchoGridPreview} from "@/features/overview/ui/OverviewDetailPane.jsx";

export function BagView({
                     onEquip,
                     setEditingEcho,
                     echoBag,
                     filteredEchoes,
                            getImageSrc
                 }) {

    return (
        <div className="modal-body echo-grid">
            {filteredEchoes.length === 0 ? (
                <h4 className="empty-message" style={{ fontStyle: 'italic', opacity: '0.6' }}>Empty...</h4>
            ) : (
                filteredEchoes.map(echo => (
                    <EchoTile
                        key={echo.uid}
                        echo={echo}
                        imageCache={imageCache}
                        echoBag={echoBag}
                        setEditingEcho={setEditingEcho}
                        onEquip={onEquip}
                        setIconMap={setIconMap}
                        getImageSrc={getImageSrc}
                    />
                ))
            )}
        </div>
    );
}

function EchoTile({ echo, imageCache, echoBag, setEditingEcho, onEquip, setIconMap, getImageSrc }) {
    const isMobile = useIsMobileWidth();

    const tileContent = (
        <>
            <div key={echo.uid} className="echo-tile bag"
                 onClick={() => {
                     const freshEcho = echoBag.find(e => e.uid === echo.uid);
                     setEditingEcho(freshEcho);
                 }}
            >
                <div className="remove-button-container">
                    <button
                        className="remove-substat-button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeEchoFromBag(echo.uid);
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>
                {!isMobile ? (
                    <EchoGridPreview
                        echo={echo}
                        getImageSrc={getImageSrc}
                        setIconMap={setIconMap}
                        className={'echo-parser-preview preset-preview'}
                    />
                ) : (
                    <div
                        className="echo-stats-preview"
                        onClick={() => {
                            const freshEcho = echoBag.find(e => e.uid === echo.uid);
                            setEditingEcho(freshEcho);
                        }}
                        style={{
                            paddingTop: isMobile ? '20px' : undefined,
                        }}
                    >
                        <div className="echo-bag-info-main">
                            {Object.entries(echo.mainStats ?? {}).map(([key, val]) => {
                                const label = formatStatKey(key);
                                const iconUrl = statIconMap[label];

                                return (
                                    <div key={key} className="stat-row">
                                <span className="echo-stat-label">
                                    {iconUrl && (
                                        <div
                                            className="stat-icon"
                                            style={{
                                                width: 15,
                                                height: 15,
                                                backgroundColor: '#999',
                                                WebkitMaskImage: `url(${iconUrl})`,
                                                maskImage: `url(${iconUrl})`,
                                                WebkitMaskRepeat: 'no-repeat',
                                                maskRepeat: 'no-repeat',
                                                WebkitMaskSize: 'contain',
                                                maskSize: 'contain',
                                                display: 'inline-block',
                                                marginRight: '0.2rem',
                                                verticalAlign: 'middle',
                                                paddingRight: '0.2rem',
                                            }}
                                        />
                                    )}
                                    {label}
                                </span>
                                        <span className="echo-stat-value">
                                    {key.endsWith('Flat') ? val : `${val.toFixed(1)}%`}
                                </span>
                                    </div>
                                );
                            })}
                        </div>
                        {Object.entries(echo.subStats ?? {}).map(([key, val]) => {
                            const label = formatStatKey(key);
                            const iconUrl = statIconMap[label];

                            return (
                                <div key={key} className="stat-row">
                            <span className="echo-stat-label">
                                {iconUrl && (
                                    <div
                                        className="stat-icon"
                                        style={{
                                            width: 15,
                                            height: 15,
                                            backgroundColor: '#999',
                                            WebkitMaskImage: `url(${iconUrl})`,
                                            maskImage: `url(${iconUrl})`,
                                            WebkitMaskRepeat: 'no-repeat',
                                            maskRepeat: 'no-repeat',
                                            WebkitMaskSize: 'contain',
                                            maskSize: 'contain',
                                            display: 'inline-block',
                                            marginRight: '0.2rem',
                                            verticalAlign: 'middle',
                                            paddingRight: '0.2rem',
                                        }}
                                    />
                                )}
                                {label}
                            </span>
                                    <span className="echo-stat-value">
                                {key.endsWith('Flat') ? val : `${val.toFixed(1)}%`}
                            </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="modal-footer">
                    {[1, 2, 3, 4, 5].map(slotIndex => (
                        <button
                            key={slotIndex}
                            className="edit-substat-button slot"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const freshEcho = echoBag.find(e => e.uid === echo.uid);
                                if (freshEcho) {
                                    onEquip(freshEcho, slotIndex - 1);
                                }
                            }}
                        >
                            {slotIndex}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );

    return isMobile ? (
        <ExpandableEchoSection
            echo={echo}
            imageCache={imageCache}
            setIconMap={setIconMap}
            defaultOpen={false}
        >
            {tileContent}
        </ExpandableEchoSection>
    ) : tileContent;
}


function useIsMobileWidth(maxWidth = 379) {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= maxWidth);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= maxWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [maxWidth]);

    return isMobile;
}