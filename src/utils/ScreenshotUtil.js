import { toPng } from 'html-to-image';

function dataUrlToBlob(dataUrl) {
    const [hdr, b64] = dataUrl.split(',');
    const mime = (hdr.match(/:(.*?);/)?.[1]) || 'image/png';
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
}

async function copyDataUrlToClipboard(dataUrl) {
    if (!('clipboard' in navigator) || !('ClipboardItem' in window)) {
        await navigator.clipboard?.writeText?.(dataUrl);
        return false;
    }
    const item = new ClipboardItem({ 'image/png': dataUrlToBlob(dataUrl) });
    await navigator.clipboard.write([item]);
    return true;
}

export async function downloadFixedSizePNG(
    node,
    {
        width = 1920,
        height = 1080,
        filename = 'image.png',
        classForExport = 'export-mode',
        pixelRatio = 2,
        copyToClipboard = false,
        shouldDownload = true,
    } = {}
) {
    if (!node) return { dataUrl: null, copied: false };

    const container = document.createElement('div');
    Object.assign(container.style, {
        position: 'fixed',
        top: '-100000px',
        left: '0',
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'hidden',
        display: 'block',
    });
    document.body.appendChild(container);

    const clone = node.cloneNode(true);
    clone.classList?.add(classForExport);
    Object.assign(clone.style, {
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: 'none',
        maxHeight: 'none',
        boxSizing: 'border-box',
    });
    container.appendChild(clone);

    await new Promise(r => requestAnimationFrame(r));
    if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }

    const dataUrl = await toPng(clone, {
        cacheBust: true,
        width,
        height,
        style: {
            width: `${width}px`,
            height: `${height}px`,
            transform: 'none',
            maxWidth: 'none',
            maxHeight: 'none',
        },
        pixelRatio,
    });

    if (shouldDownload) {
        const a = document.createElement('a');
        a.download = filename;
        a.href = dataUrl;
        a.click();
    }

    let copied = false;
    if (copyToClipboard) {
        try { copied = await copyDataUrlToClipboard(dataUrl); } catch { /* ignore */ }
    }

    document.body.removeChild(container);
    return { dataUrl, copied };
}