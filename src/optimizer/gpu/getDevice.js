let gpuDevice = null;
let gpuAdapter = null;

export async function getGpuDevice() {
    if (gpuDevice) return gpuDevice;

    const gpu = (self.navigator?.gpu) || (globalThis.navigator?.gpu);
    if (!gpu) {
        throw new Error("WebGPU not supported in this execution context.");
    }

    gpuAdapter = await gpu.requestAdapter();
    if (!gpuAdapter) {
        throw new Error("Failed to request WebGPU adapter.");
    }

    // ---- IMPORTANT ----
    // Read all adapter-supported limits
    const adapterLimits = gpuAdapter.limits;

    // Request them explicitly so Chrome/Safari won't downgrade them
    const requiredLimits = {
        maxStorageBufferBindingSize: adapterLimits.maxStorageBufferBindingSize,
        maxComputeWorkgroupSizeX: adapterLimits.maxComputeWorkgroupSizeX,
        maxComputeWorkgroupSizeY: adapterLimits.maxComputeWorkgroupSizeY,
        maxComputeWorkgroupSizeZ: adapterLimits.maxComputeWorkgroupSizeZ,
        maxComputeInvocationsPerWorkgroup: adapterLimits.maxComputeInvocationsPerWorkgroup,
        maxComputeWorkgroupStorageSize: adapterLimits.maxComputeWorkgroupStorageSize,

        // THE CRITICAL ONE — allows >256MB buffers
        maxBufferSize: adapterLimits.maxBufferSize
    };

    gpuDevice = await gpuAdapter.requestDevice({
        requiredLimits
    });

    return gpuDevice;
}

export function getGpuAdapter() {
    return gpuAdapter;
}