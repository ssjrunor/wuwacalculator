import commonWGSL from "../shaders/common.wgsl?raw";
import reduceWGSL from "../shaders/reduceCandidates.wgsl?raw";
import coreWGSL from "../shaders/computeDamage.wgsl?raw";
import mainWGSL from "../shaders/echoOptimizerMain.wgsl?raw";

export const shaderCode = `
${commonWGSL}

${reduceWGSL}

${coreWGSL}

${mainWGSL}
`;