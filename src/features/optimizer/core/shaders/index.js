import commonWGSL from "../shaders/common.wgsl?raw";
import coreWGSL from "../shaders/computeDamage.wgsl?raw";
import mainWGSL from "../shaders/echoOptimizerMain.wgsl?raw";
import rotationCoreWGSL from "../shaders/rotationComputeDamage.wgsl?raw";
import rotationMainWGSL from "../shaders/echoOptimizerRotation.wgsl?raw";

export const shaderCode = `
${commonWGSL}

${coreWGSL}

${mainWGSL}
`;

export const rotationShaderCode = `
${commonWGSL}

${rotationCoreWGSL}

${rotationMainWGSL}
`;