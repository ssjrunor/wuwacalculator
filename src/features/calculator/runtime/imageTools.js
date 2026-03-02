export async function cropAndCompressImage(
    fileOrUrl,
    quality = 0.1,
    targetWidth = window.innerWidth,
    targetHeight = window.innerHeight
) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const inputWidth = img.width;
            const inputHeight = img.height;
            const inputAspect = inputWidth / inputHeight;
            const targetAspect = targetWidth / targetHeight;

            let cropWidth;
            let cropHeight;
            let startX;
            let startY;

            if (inputAspect > targetAspect) {
                cropHeight = inputHeight;
                cropWidth = inputHeight * targetAspect;
                startX = (inputWidth - cropWidth) / 2;
                startY = 0;
            } else {
                cropWidth = inputWidth;
                cropHeight = inputWidth / targetAspect;
                startX = 0;
                startY = (inputHeight - cropHeight) / 2;
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject("Compression failed");

                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        resolve(base64data);
                    };
                    reader.readAsDataURL(blob);
                },
                "image/webp",
                quality
            );
        };

        img.onerror = reject;
    });
}
