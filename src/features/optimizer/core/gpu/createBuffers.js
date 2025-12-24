export async function createGpuBuffers({
                                           echoStats,
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
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(contextBuffer, 0, gpuContexts);

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
        echoSets: echoSetsBuffer,
        combos: combosBuffer,
        context: contextBuffer,
        mainEchoBuffs: mainEchoBuffsBuffer,
        statConstraints: statConstraintsBuffer,
        echoKindIds: echoKindIdsBuffer,
    };
}
