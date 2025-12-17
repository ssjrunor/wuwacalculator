export async function runEchoGpuPipeline({
                                             device,
                                             pipeline,
                                             bindGroup,
                                             comboCount
                                         }) {
    const WORKGROUP_SIZE = 512;
    const CYCLES_PER_INVOCATION = 8;

    const invocationsNeeded = Math.ceil(comboCount / CYCLES_PER_INVOCATION);

    const totalWorkgroups = Math.ceil(invocationsNeeded / WORKGROUP_SIZE);

    const MAX_WG = 65535;

    let remaining = totalWorkgroups;
    let offset = 0;

    while (remaining > 0) {
        const thisBatch = Math.min(remaining, MAX_WG);

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();

        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);

        pass.dispatchWorkgroups(thisBatch);
        pass.end();

        device.queue.submit([encoder.finish()]);

        offset += thisBatch;
        remaining -= thisBatch;
    }
}

export async function readResults(device, outputBuffer, comboCount) {
    const byteSize = comboCount * 4;

    const readBuffer = device.createBuffer({
        size: byteSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, byteSize);
    device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const copy = readBuffer.getMappedRange();

    const result = new Float32Array(copy.slice(0));

    readBuffer.unmap();
    return result;
}

export async function readResultsMapped(device, outputBuffer, comboCount, fn, reuse) {
    const byteSize = comboCount * 4;
    let readBuffer = reuse?.buffer ?? null;
    let readSize = reuse?.size ?? 0;

    if (!readBuffer || readSize < byteSize) {
        if (readBuffer) readBuffer.destroy();
        readBuffer = device.createBuffer({
            size: byteSize,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        readSize = byteSize;
    }

    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, byteSize);
    device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    try {
        const view = new Float32Array(readBuffer.getMappedRange());
        const out = fn(view);
        return { out, reuse: { buffer: readBuffer, size: readSize } };
    } finally {
        readBuffer.unmap();
    }
}