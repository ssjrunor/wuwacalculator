import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { echoImageMap, setNameImageMap } from '../utils/autoEchoImageMap';
import { applyParsedEchoesToEquipped } from "../utils/buildEchoObjectsFromParsedResults.js";

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

const EchoParser = ({ onEchoesParsed, charId, setCharacterRuntimeStates, setPopupMessage, setShowToast }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [imageElement, setImageElement] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
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

    const handleImageFile = (file) => {
        (async () => {
            await preloadReferenceImages(echoImageMap, { width: 192, height: 182 }, echoImageCache);
            await preloadReferenceImages(setNameImageMap, { width: 48, height: 48 }, setIconImageCache);
        })();
        setErrorImageSize(false);
        const img = new Image();

        img.onload = async () => {
            if (img.naturalWidth !== 1920 || img.naturalHeight !== 1080) {
                setErrorImageSize(true);
                setPopupMessage({
                    message: 'Nice Try! But... This isn\'t a valid image (￣￢￣ヾ)',
                    icon: '✘',
                    color: 'red'
                });
                setShowToast(true);
                setIsShaking(true);
                setImageSrc(null);
                return;
            }

            setIsLoading(true);
            setImageElement(img);
            setImageSrc(img.src);

            const worker = await Tesseract.createWorker('eng');
            await worker.setParameters({
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.%+ ',
                tessedit_pageseg_mode: 1
            });

            const parsedResults = await parseEchoes(img, worker);
            await worker.terminate();

            applyParsedEchoesToEquipped(parsedResults, charId, setCharacterRuntimeStates);

            if (onEchoesParsed) onEchoesParsed(parsedResults);

            setIsLoading(false);
            setShowRulesModal(false);
            setPopupMessage({
                message: 'Success~! (〜^∇^)〜',
                icon: '✔',
                color: { light: 'green', dark: 'limegreen' },
            });
            setShowToast(true);
        };

        img.src = URL.createObjectURL(file);
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
            } catch (err) {
                continue;
            }
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
                style={{display: 'flex', justifyContent: 'space-between'}}
            >
                <button
                    onClick={() => {
                        setIsShaking(false);
                        setShowRulesModal(true);
                    }}
                    className="btn-primary"
                >
                    Import Echo
                </button>
                <button
                    onClick={() => {
                        setCharacterRuntimeStates(prev => ({
                            ...prev,
                            [charId]: {
                                ...(prev[charId] ?? {}),
                                equippedEchoes: [null, null, null, null, null]
                            }
                        }));
                    }}
                    className="rotation-button clear"
                >
                    Unequip All
                </button>
            </div>

            {showRulesModal && (
                <div
                    className={`skills-modal-overlay parser ${isClosing ? 'closing' : ''}`}
                    onClick={handleClose}
                >
                    <div
                        className={`skills-modal-content parser ${isClosing ? 'closing' : ''} ${isShaking ? 'shake' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-main-content">
                            <h2 className="modal-title">Import Echo</h2>

                            <ul className="modal-list">
                                <img
                                    src="/assets/sample-import-image.png"
                                    alt="Sample Echo Import Format"
                                    className="modal-sample-image"
                                />
                                <li>
                                    - Image should be generated with the <strong>wuwa bot</strong> on the official Wuthering Waves Discord server <code style={{opacity: "0.7"}}>/create</code> (or anywhere else you can use the bot ¯\_(ツ)_/¯).
                                    Should be similar to the image above.
                                </li>
                                <li>
                                    - Do <strong>NOT</strong> resize, compress, or crop the image.
                                </li>
                                <li>
                                    - Should be <strong>1920</strong> x <strong>1080</strong> (make sure to confirm).
                                </li>
                                <li>
                                    - Might not be 100% correct all the time so you may have to edit them post-import.
                                </li>
                                <li>
                                    - Only works well with en texts.
                                </li>
                                <li>
                                    {isLoading ? (
                                        <div className="loader-overlay">
                                            <div className="spinner" />
                                        </div>
                                    ) : (
                                        <strong style={{color:"crimson", display: "flex", justifySelf: "center"}}>Only imports echoes</strong>
                                    )}
                                </li>
                            </ul>

                            <div className="modal-dropzone">
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file) handleImageFile(file);
                                    }}
                                    className="modal-dropzone-text"
                                >
                                    <p
                                        className={`dropzone-click-text`}
                                        onClick={() => {
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        Choose Image
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EchoParser;