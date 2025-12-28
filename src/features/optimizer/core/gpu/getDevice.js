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

    const adapterLimits = gpuAdapter.limits;

    const requiredLimits = {
        maxStorageBufferBindingSize: adapterLimits.maxStorageBufferBindingSize,
        maxComputeWorkgroupSizeX: adapterLimits.maxComputeWorkgroupSizeX,
        maxComputeWorkgroupSizeY: adapterLimits.maxComputeWorkgroupSizeY,
        maxComputeWorkgroupSizeZ: adapterLimits.maxComputeWorkgroupSizeZ,
        maxComputeInvocationsPerWorkgroup: adapterLimits.maxComputeInvocationsPerWorkgroup,
        maxComputeWorkgroupStorageSize: adapterLimits.maxComputeWorkgroupStorageSize,
        maxBufferSize: adapterLimits.maxBufferSize
    };

    gpuDevice = await gpuAdapter.requestDevice({
        requiredLimits
    });

    return gpuDevice;
}

export async function detectWebGPUSupport() {
    try {
        const device = await getGpuDevice();
        return !!device;
    } catch (err) {
        console.warn("WebGPU not available:", err);
        return false;
    }
}
