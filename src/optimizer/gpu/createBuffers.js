export async function createGpuBuffers({
                                           echoStats,
                                           echoCosts,
                                           echoSets,
                                           combos,
                                           gpuContexts,
                                           mainEchoBuffs,
                                           statConstraints,
                                           echoKindIds,
                                           deviceOverride
                                       }) {
    const device = deviceOverride;

    const echoStatsBuffer = device.createBuffer({
        size: echoStats.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(echoStatsBuffer, 0, echoStats);

    const echoCostsBuffer = device.createBuffer({
        size: echoCosts.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(echoCostsBuffer, 0, echoCosts);

    const echoSetsBuffer = device.createBuffer({
        size: echoSets.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(echoSetsBuffer, 0, echoSets);

    const combosBuffer = device.createBuffer({
        size: combos.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(combosBuffer, 0, combos);

    const contextBuffer = device.createBuffer({
        size: gpuContexts.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(contextBuffer, 0, gpuContexts);

    const outputBuffer = device.createBuffer({
        size: (combos.length / 5) * 4, // 4 bytes per float
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const mainEchoBuffsBuffer = device.createBuffer({
        size: mainEchoBuffs.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(mainEchoBuffsBuffer, 0, mainEchoBuffs);

    const statConstraintsBuffer = device.createBuffer({
        size: statConstraints.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(statConstraintsBuffer, 0, statConstraints);

    const echoKindIdsBuffer = device.createBuffer({
        size: echoKindIds.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(echoKindIdsBuffer, 0, echoKindIds);

    return {
        echoStats: echoStatsBuffer,
        echoCosts: echoCostsBuffer,
        echoSets: echoSetsBuffer,
        combos: combosBuffer,
        context: contextBuffer,
        outputBuffer,
        mainEchoBuffs: mainEchoBuffsBuffer,
        statConstraints: statConstraintsBuffer,
        echoKindIds: echoKindIdsBuffer,
    };
}