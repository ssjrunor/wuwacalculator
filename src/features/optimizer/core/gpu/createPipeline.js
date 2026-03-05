import { rotationShaderCode, shaderCode } from "../shaders/index.js";
import reduceWGSL from "../shaders/reduceCandidates.wgsl?raw";

export function createPipeline(device, layout, entryPoint = "main") {
    const shaderModule = device.createShaderModule({ code: shaderCode });

    return device.createComputePipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [layout],
        }),
        compute: {
            module: shaderModule,
            entryPoint,
        },
    });
}

export function createRotationPipeline(device, layout, entryPoint = "mainRotation") {
    const shaderModule = device.createShaderModule({ code: rotationShaderCode });

    return device.createComputePipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [layout],
        }),
        compute: {
            module: shaderModule,
            entryPoint,
            constants: {
                CYCLES_PER_INVOCATION: 4,
            },
        },
    });
}

export function createReducePipeline(device) {
    const layout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
        ],
    });

    const shaderModule = device.createShaderModule({ code: reduceWGSL });

    const pipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [layout],
        }),
        compute: {
            module: shaderModule,
            entryPoint: "reduceCandidates",
        },
    });

    return { pipeline, layout };
}

export function createReduceBindGroup(device, layout, buffers) {
    return device.createBindGroup({
        layout,
        entries: [
            { binding: 0, resource: { buffer: buffers.input } },
            { binding: 1, resource: { buffer: buffers.output } },
            { binding: 2, resource: { buffer: buffers.params } },
        ],
    });
}

export function createBindGroup(device, layout, buffers) {
    return device.createBindGroup({
        layout,
        entries: [
            { binding: 0, resource: { buffer: buffers.echoStats } },
            { binding: 1, resource: { buffer: buffers.setConstLut } },
            { binding: 2, resource: { buffer: buffers.echoSets } },
            { binding: 3, resource: { buffer: buffers.comboIndexMap } },
            { binding: 4, resource: { buffer: buffers.context } },
            { binding: 5, resource: { buffer: buffers.echoCosts } },
            { binding: 6, resource: { buffer: buffers.mainEchoBuffs } },
            { binding: 7, resource: { buffer: buffers.statConstraints } },
            { binding: 8, resource: { buffer: buffers.echoKindIds } },
            { binding: 9, resource: { buffer: buffers.candidates } },
            { binding: 10, resource: { buffer: buffers.comboBinom } },
        ],
    });
}

export function createRotationBindGroup(device, layout, buffers) {
    return device.createBindGroup({
        layout,
        entries: [
            { binding: 0, resource: { buffer: buffers.echoStats } },
            { binding: 1, resource: { buffer: buffers.setConstLut } },
            { binding: 2, resource: { buffer: buffers.echoSets } },
            { binding: 3, resource: { buffer: buffers.comboIndexMap } },
            { binding: 4, resource: { buffer: buffers.context } },
            { binding: 5, resource: { buffer: buffers.echoCosts } },
            { binding: 6, resource: { buffer: buffers.mainEchoBuffs } },
            { binding: 7, resource: { buffer: buffers.statConstraints } },
            { binding: 8, resource: { buffer: buffers.echoKindIds } },
            { binding: 9, resource: { buffer: buffers.candidates } },
            { binding: 10, resource: { buffer: buffers.comboBinom } },
            { binding: 11, resource: { buffer: buffers.rotationContexts } },
            { binding: 13, resource: { buffer: buffers.rotationMeta } },
        ],
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
                buffer: { type: "read-only-storage" } },

            { binding: 6, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },

            { binding: 7, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "uniform" } },

            { binding: 8, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },

            { binding: 9, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" } },

            { binding: 10, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },
        ]
    });
}

export function createRotationBindGroupLayout(device) {
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
                buffer: { type: "read-only-storage" } },

            { binding: 6, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },

            { binding: 7, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "uniform" } },

            { binding: 8, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },

            { binding: 9, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "storage" } },

            { binding: 10, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },

            { binding: 11, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "read-only-storage" } },

            { binding: 13, visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "uniform" } },
        ]
    });
}
