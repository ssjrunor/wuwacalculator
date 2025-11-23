export async function runEchoGpuPipeline({
                                             device,
                                             pipeline,
                                             bindGroup,
                                             comboCount
                                         }) {
    // Must match WGSL:
    // @workgroup_size(512)
    // const CYCLES_PER_INVOCATION : u32 = 8u;
    const WORKGROUP_SIZE = 512;
    const CYCLES_PER_INVOCATION = 8;

    // How many shader invocations do we need total?
    const invocationsNeeded = Math.ceil(comboCount / CYCLES_PER_INVOCATION);

    // How many workgroups of size 512 to cover those invocations?
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