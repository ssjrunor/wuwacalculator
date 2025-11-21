export async function runEchoGpuPipeline({
                                             device,
                                             pipeline,
                                             bindGroup,
                                             comboCount
                                         }) {
    const workgroupSize = 64;
    const totalWorkgroups = Math.ceil(comboCount / workgroupSize);

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

        // wait so we don’t overload the submission queue
        await device.queue.onSubmittedWorkDone();
    }
}

export async function readResults(device, outputBuffer, comboCount) {
    const byteSize = comboCount * 4;

    const readBuffer = device.createBuffer({
        size: byteSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    // Copy into readBuffer
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, byteSize);
    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();


    // Wait and map
    await readBuffer.mapAsync(GPUMapMode.READ);
    const copy = readBuffer.getMappedRange();

    // Convert to float array
    const result = new Float32Array(copy.slice(0));

    readBuffer.unmap();
    return result;
}