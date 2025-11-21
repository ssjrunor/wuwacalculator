import shaderCode from "../shaders/echoOptimizer.wgsl?raw";

export function createPipeline(device, layout) {
    const shaderModule = device.createShaderModule({ code: shaderCode });

    return device.createComputePipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [layout]
        }),
        compute: {
            module: shaderModule,
            entryPoint: "main"
        }
    });
}

export function createBindGroup(device, layout, buffers) {
    return device.createBindGroup({
        layout,
        entries: [
            { binding: 0, resource: { buffer: buffers.echoStats } },
            { binding: 1, resource: { buffer: buffers.echoCosts } },
            { binding: 2, resource: { buffer: buffers.echoSets } },
            { binding: 3, resource: { buffer: buffers.combos } },
            { binding: 4, resource: { buffer: buffers.context } },
            { binding: 5, resource: { buffer: buffers.outputBuffer } },
            { binding: 6, resource: { buffer: buffers.mainEchoBuffs } }
        ]
    });
}

export function createBindGroupLayout(device) {
    return device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },

            { binding: 1, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },

            { binding: 2, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },

            { binding: 3, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },

            { binding: 4, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "uniform" } },

            { binding: 5, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" } },

            { binding: 6, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },
        ]
    });
}