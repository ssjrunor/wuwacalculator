import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { echoImageMap, setNameImageMap } from '@shared/utils/autoEchoImageMap.js';
import { applyParsedEchoesToEquipped } from "@shared/utils/buildEchoObjectsFromParsedResults.js";
import {useNavigate} from "react-router-dom";
import {getEchoScores, getTop5SubstatScoreDetails} from "@shared/utils/echoHelper.js";
import { setIconMap } from "@shared/constants/echoSetData2.js";
import {EchoGridPreview} from "@/features/overview/ui/OverviewDetailPane.jsx";
import {imageCache} from "@/features/calculator/runtime/visualResourceStore.js";
import {getEquippedEchoesScoreDetails} from "./EchoesPane.jsx";
import {addEchoPreset} from "@shared/state/echoPresetStore.js";

const echoImageCache = {};
const setIconImageCache = {};

const preloadReferenceImages = async (imageMap, size, targetCache) => {
    const entries = Object.entries(imageMap);
    for (let i = 0; i < entries.length; i++) {
        const [label, src] = entries[i];
        if (targetCache[label]) continue;
        try {
            const img = await loadImage(src);
            const ctx = imageToCanvasContext(img, size.width, size.height);
            targetCache[label] = ctx;
        } catch (err) {
            // handle error
        }
    }
};

const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
};

const imageToCanvasContext = (image, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
    }
    ctx.putImageData(imgData, 0, 0);
    return ctx;
};

const EchoParser = ({
                        onEchoesParsed,
                        charId,
                        setCharacterRuntimeStates,
                        setPopupMessage,
                        setShowToast,
                        openGuide,
                        characterRuntimeStates,
                        setConfirmMessage,
                        setShowConfirm,
                        saveAllEchoesToBag,
                        setGuideClose,
                    }) => {
    const [parsedEchoes, setParsedEchoes] = useState([]);
    const [view, setView] = useState('instructions');
    const getImageSrc = (icon) => imageCache[icon]?.src || icon;
    const [imageSrc, setImageSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcesing, setIsProcesing] = useState(false);
    const [errorImageSize, setErrorImageSize] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        handleImageFile(file);
                        break;
                    }
                }
            }
        }
    };

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    async function parseEchoImage(file) {
        await preloadReferenceImages(echoImageMap, { width: 192, height: 182 }, echoImageCache);
        await preloadReferenceImages(setNameImageMap, { width: 48, height: 48 }, setIconImageCache);

        const img = new Image();
        const loadPromise = new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
        img.src = URL.createObjectURL(file);

        const loadedImg = await loadPromise;

        // Safety check
        if (loadedImg.naturalWidth !== 1920 || loadedImg.naturalHeight !== 1080) {
            throw new Error('invalid_image_size');
        }

        const worker = await Tesseract.createWorker('eng');
        await worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.%+ ',
            tessedit_pageseg_mode: 1,
        });

        const parsedResults = await parseEchoes(loadedImg, worker);
        await worker.terminate();

        return parsedResults;
    }

    function applyParsedEchoes(parsedResults, charId, setCharacterRuntimeStates, setPopupMessage, setShowToast) {
        const newEquippedEchoes = applyParsedEchoesToEquipped(parsedResults);

        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] || {}),
                equippedEchoes: newEquippedEchoes
            }
        }));

        setPopupMessage({
            message: 'Success~! (〜^∇^)〜',
            icon: '✔',
            color: { light: 'green', dark: 'limegreen' },
        });
        setShowToast(true);
        setIsProcesing(false);
        setView('instructions');
    }

    const handleImageFile = async (file) => {
        setErrorImageSize(false);
        setIsShaking(false);
        setImageSrc(null);

        try {
            setIsProcesing(true);
            setIsLoading(true);

            const parsedResults = await parseEchoImage(file);

            setParsedEchoes(parsedResults);

            /*setIsClosing(true);

            setTimeout(() => {
                setView('preview');
                setIsClosing(false);
            }, 300);*/

            handleClose();

            setTimeout(() => {
                setView('preview');
                setShowRulesModal(true);
                setIsClosing(false);
            }, 300);

            setIsLoading(false);
        } catch (err) {
            setIsLoading(false);

            if (err.message === 'invalid_image_size') {
                setErrorImageSize(true);
                setPopupMessage({
                    message: "Nice Try! But... This isn't a valid image (￣￢￣ヾ)",
                    icon: '✘',
                    color: 'red',
                });
            } else {
                console.error(err);
                setPopupMessage({
                    message: 'Parsing failed, please try again.',
                    icon: '✘',
                    color: 'red',
                });
            }

            setShowToast(true);
            setIsShaking(true);
        }
    };

    const parseEchoes = async (img, worker) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const coords = getEchoCoordinates();
        const results = [];

        for (let index = 0; index < coords.length; index++) {
            const echo = coords[index];

            await worker.setParameters({
                tessedit_char_whitelist: '0123456789',
                tessedit_pageseg_mode: 1
            });
            let cost = await extractTextFromRegion(canvas, worker, echo.cost);
            cost = cost.replace(/[^0-9]/g, '');
            if (!['1', '3', '4'].includes(cost)) cost = '4';

            await worker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.%+ ',
                tessedit_pageseg_mode: 1
            });

            const mainStatLabel = await extractTextFromRegion(canvas, worker, echo.mainStatLabel);

            const substats = [];
            for (const sub of echo.substats) {
                const text = await extractTextFromRegion(canvas, worker, sub);
                const cleaned = text.replace(/\n/g, ' ').replace(/[^\w.%+ ]/g, '').trim();
                substats.push(cleaned);
            }

            const echoName = await matchImageRegion(canvas, echoImageRegion(index), echoImageMap, { width: 192, height: 182 }, echoImageCache);
            const setName = await matchImageRegion(canvas, setIconRegion(index), setNameImageMap, { width: 56, height: 56 }, setIconImageCache);

            results.push({ cost, mainStatLabel, substats, echo: echoName, set: setName });
        }

        return results;
    };

    const extractTextFromRegion = async (canvas, worker, region) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = region.width;
        tempCanvas.height = region.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(canvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
        const { data: { text } } = await worker.recognize(tempCanvas.toDataURL());
        return text.trim();
    };

    const extractImageRegion = (canvas, region) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = region.width;
        tempCanvas.height = region.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(canvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
        return ctx;
    };

    const compareImageData = (ctx1, ctx2, width, height) => {
        const d1 = ctx1.getImageData(0, 0, width, height).data;
        const d2 = ctx2.getImageData(0, 0, width, height).data;

        let sumSq = 0;
        for (let i = 0; i < d1.length; i += 4) {
            for (let j = 0; j < 3; j++) {
                const diff = d1[i + j] - d2[i + j];
                sumSq += diff * diff;
            }
        }

        return sumSq / (width * height * 3);
    };

    const matchImageRegion = async (canvas, region, referenceMap, size, cache = null) => {
        const inputCtx = extractImageRegion(canvas, region);
        let bestMatch = null;
        let minDiff = Infinity;

        for (const [label, src] of Object.entries(referenceMap)) {
            try {
                const refCtx = cache?.[label] ?? await (async () => {
                    const img = await loadImage(src);
                    return imageToCanvasContext(img, size.width, size.height);
                })();
                const diff = compareImageData(inputCtx, refCtx, size.width, size.height);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestMatch = label;
                }
            } catch (err) {}
        }

        return bestMatch;
    };

    const getEchoCoordinates = () => {
        const coords = [];
        for (let i = 0; i < 5; i++) {
            const offset = i * 374;
            coords.push({
                cost: { x: 336 + offset, y: 674, width: 18, height: 24 },
                mainStatLabel: { x: 215 + offset, y: 720, width: 173, height: 40 },
                substats: [
                    { x: 64 + offset, y: 880, width: 320, height: 38 },
                    { x: 64 + offset, y: 918, width: 320, height: 38 },
                    { x: 64 + offset, y: 950, width: 320, height: 38 },
                    { x: 64 + offset, y: 984, width: 320, height: 38 },
                    { x: 64 + offset, y: 1019, width: 320, height: 38 }
                ]
            });
        }
        return coords;
    };

    const echoImageRegion = (index) => ({
        x: 22 + index * 374,
        y: 650,
        width: 192,
        height: 182
    });
    const setIconRegion = (index) => ({
        x: 267 + index * 374,
        y: 663,
        width: 48,
        height: 48
    });

    const [showRulesModal, setShowRulesModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowRulesModal(false);
            setIsClosing(false);
        }, 300);
    };

    const runtime = characterRuntimeStates[charId];
    const equippedEchoes = runtime.equippedEchoes;
    const empty = !equippedEchoes || equippedEchoes.length === 0 ||
        (Array.isArray(equippedEchoes) && equippedEchoes.every(e => e === null));

    const guides = ['Echoes', 'Build and Echo Scoring', 'Echo Importing', 'Echo Presets'];

    return (
        <div className="echo-parser">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <div
                className='rotation-buttons-left'
                style={{display: 'flex', gap: '1rem'}}
            >
                <button
                    onClick={() => {
                        setIsShaking(false);
                        setShowRulesModal(true);
                    }}
                    className="btn-primary echoes"
                >
                    Import Echo
                </button>
                {!empty && (
                    <button
                        className="btn-primary echoes"
                        onClick={() => saveAllEchoesToBag(equippedEchoes)}
                    >
                        Save All
                    </button>
                )}
                {!empty && (
                    <button
                        onClick={() => {
                            const preset = addEchoPreset(runtime);
                            if (!preset) {
                                setPopupMessage({
                                    message: `OH! seems like you already have this one saved~! (゜。゜)`,
                                    icon: '❤',
                                    color: { light: 'green', dark: 'limegreen' },
                                });
                            } else {
                                setPopupMessage({
                                    message: 'Added Successfully~! (〜^∇^)〜',
                                    icon: '✔',
                                    color: { light: 'green', dark: 'limegreen' },
                                });
                            }
                            setShowToast(true);
                        }}
                        className="btn-primary echoes"
                    >
                        Save Preset
                    </button>
                )}
                {!empty && (
                    <button
                        onClick={() => {
                            setConfirmMessage({
                                confirmLabel: 'Unequip All Echoes',
                                onConfirm: () => {
                                    setCharacterRuntimeStates(prev => ({
                                        ...prev,
                                        [charId]: {
                                            ...(prev[charId] ?? {}),
                                            equippedEchoes: [null, null, null, null, null]
                                        }
                                    }));
                                    setPopupMessage({
                                        message: 'Stripped~! (〜^∇^)〜',
                                        icon: '✔',
                                        color: { light: 'green', dark: 'limegreen' },
                                    });
                                    setShowToast(true);
                                },
                            });
                            setShowConfirm(true);
                        }}
                        className="rotation-button clear echoes"
                    >
                        Unequip All
                    </button>
                )}
                <button onClick={() => openGuide(guides)} className="btn-primary echoes"
                style={{ marginLeft: 'auto'}}>
                    See Guides
                </button>
            </div>

            {showRulesModal && (
                <div
                    className={`
                        skills-modal-overlay parser
                        ${isClosing ? 'closing' : ''}
                    `}
                    onClick={() => {
                        handleClose();
                        setIsProcesing(false);
                    }}
                >
                    <div
                        className={`
                            skills-modal-content 
                            parser 
                            changelog-modal 
                            guides 
                            ${isClosing ? 'closing' : ''} 
                            ${isShaking ? 'shake' : ''}
                            ${ view === 'preview' ? 'echo-parser-preview' : ''}
                        `}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {view === 'instructions' ? (
                            <ImportInstructionsView
                                isLoading={isLoading}
                                fileInputRef={fileInputRef}
                                handleImageFile={handleImageFile}
                                setGuideClose={setGuideClose}
                                handleClose={handleClose}
                                openGuide={openGuide}
                                setShowRulesModal={setShowRulesModal}
                                isProcesing={isProcesing}
                                guides={guides}
                            />
                        ) : (
                            <ParsedEchoesPreview
                                parsedEchoes={parsedEchoes}
                                onCancel={() => {
                                    setIsProcesing(false);
                                    handleClose();

                                    setTimeout(() => {
                                        setView('instructions');
                                        setShowRulesModal(true);
                                        setIsClosing(false);
                                    }, 300);
                                }}
                                onImport={(results) => {
                                    applyParsedEchoes(results, charId, setCharacterRuntimeStates, setPopupMessage, setShowToast);
                                    handleClose();
                                }}
                                charId={charId}
                                getImageSrc={getImageSrc}
                                applyParsedEchoesToEquipped={applyParsedEchoesToEquipped}
                                runtime={characterRuntimeStates[charId]}
                                saveAllEchoesToBag={saveAllEchoesToBag}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

function ParsedEchoesPreview ({ parsedEchoes, onCancel, onImport, charId, getImageSrc, applyParsedEchoesToEquipped, runtime, saveAllEchoesToBag }) {
    const maxScore = getTop5SubstatScoreDetails(charId).total;
    const echoes = applyParsedEchoesToEquipped(parsedEchoes);

    const buildScore = getEquippedEchoesScoreDetails(
        charId,
        { [charId]: { ...runtime, equippedEchoes: echoes } }
    );
    const maxBuildScore = maxScore * 5;
    const percentScore = (buildScore.total / maxBuildScore) * 100;

    return (
        <div className="modal-main-content echo-preview-view">
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <h2>Import Preview</h2>
                <h4
                    style={{ marginLeft: 'auto', marginBottom: 'unset', padding: '0.5rem 0.9rem' }}
                    className="echo-buff"
                >
                    Build Score: {percentScore > 0 ? percentScore.toFixed(1) : '??'}%
                </h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <h3>You’re about to import the following echoes:</h3>
                <div
                    style={{ marginLeft: 'auto', marginBottom: 'unset', display: 'flex', flexDirection: 'row', gap: '0.75rem' }}
                >
                    <button
                        className="btn-primary echoes"
                        onClick={() => onImport(parsedEchoes)}
                    >
                        Equip
                    </button>
                    <button
                        className="btn-primary echoes"
                        onClick={() => saveAllEchoesToBag(echoes)}
                    >
                        Save All
                    </button>
                    <button
                        className="rotation-button clear echoes"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <div
                className="echo-grid main-echo-description guides preset-preview"
                style={{ marginBottom: '1rem' }}
            >
                {[...Array(5)].map((_, index) => {
                    const echo = echoes[index] ?? null;
                    const score = (getEchoScores(charId, echo).totalScore / maxScore) * 100;

                    return (
                        <div
                            key={index}
                            className="echo-tile overview inherent-skills-box echo-parser-preview"
                            style={{margin: 'unset'}}
                        >
                            <EchoGridPreview
                                echo={echo}
                                getImageSrc={getImageSrc}
                                score={score}
                                setIconMap={setIconMap}
                                className={'echo-parser-preview'}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

const ImportInstructionsView = ({ isLoading, fileInputRef, handleImageFile, setGuideClose, handleClose, openGuide, setShowRulesModal, isProcesing, guides }) => (
    <div className="modal-main-content">
        <h2 className="modal-title">Import Echo</h2>

        <ul className="modal-list">
            <img
                src="/assets/sample-import-image.png"
                alt="Sample Echo Import Format"
                className="modal-sample-image"
                style={{ boxShadow: '0 2px 8px 0 black' }}
            />
            <li>
                - Image should be generated with the <strong>wuwa bot</strong> on the official Wuthering Waves Discord server{' '}
                <code style={{ opacity: '0.7' }}>/create</code> (or anywhere else you can use the bot ¯\_(ツ)_/¯).
                Should be similar to the image above.
            </li>
            <li>- Do <strong>NOT</strong> resize, compress, or crop the image.</li>
            <li>- Should be <strong>1920</strong> x <strong>1080</strong> (make sure to confirm).</li>
            <li>- Might not be 100% correct all the time so you may have to edit them post-import.</li>
            <li>- Only works well with English texts.</li>
            <li>
                {(isLoading || isProcesing) ? (
                    <div className="loader-overlay">
                        <div className="spinner" />
                    </div>
                ) : (
                    <strong style={{ color: 'crimson', display: 'flex', justifySelf: 'center' }}>
                        Only imports echoes
                    </strong>
                )}
            </li>
        </ul>

        <div
            className="modal-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleImageFile(file);
            }}
        >
            <div className="modal-dropzone-text">
                <p
                    className="dropzone-click-text"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Choose Image
                </p>
            </div>
        </div>
    </div>
);

export default EchoParser;