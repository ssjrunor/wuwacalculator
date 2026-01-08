fn computeDamageForEchoIds(echoIds: array<i32, 5>) -> ComboEval {
    let skillId: u32 = unpackSkillIdFromParams();
    let skillMask: u32 = skillMaskFromSkillId(skillId);
    let elementId: u32 = elementFromSkillId(skillId);
    let lockedIndex: i32 = i32(params.lockedEchoIndex);

    let base = buildEchoBase(echoIds);
    if (base.totalCost > params.comboMaxCost) {
        return ComboEval(0.0, 0u);
    }

    let sonata = applySetEffects(base, skillMask);
    let pre = buildPreMain(params, sonata, skillMask, elementId, skillId);

    let flatOnly = (pre.multiplier == 0.0 && pre.scalingAtk == 0.0 && pre.flatDmg > 0.0);

    var best: f32 = 0.0;
    var bestMain: u32 = 0u;

    for (var mainPos: u32 = 0u; mainPos < 5u; mainPos = mainPos + 1u) {
        let mainId = echoIds[mainPos];
        if (mainId < 0) { continue; }
        if (lockedIndex >= 0 && mainId != lockedIndex) { continue; }

        if (flatOnly) {
            if (pre.flatDmg > best) {
                best = pre.flatDmg;
                bestMain = mainPos;
            }
            continue;
        }

        let b = u32(mainId) * BUFFS_PER_ECHO;

        let mainAtkP = mainEchoBuffs[b + 0u];
        let mainAtkF = mainEchoBuffs[b + 1u];

        let mainType0 = vec4<f32>(
            mainEchoBuffs[b + 2u],  // basic
            mainEchoBuffs[b + 3u],  // heavy
            mainEchoBuffs[b + 4u],  // skill
            mainEchoBuffs[b + 5u]   // lib
        );

        let mainElem0 = vec4<f32>(
            mainEchoBuffs[b + 6u],  // aero
            mainEchoBuffs[b + 7u],  // glacio
            mainEchoBuffs[b + 8u],  // fusion
            mainEchoBuffs[b + 9u]   // spectro
        );

        let mainElem1 = vec2<f32>(
            mainEchoBuffs[b + 10u], // havoc
            mainEchoBuffs[b + 11u]  // electro
        );

        let mainER = mainEchoBuffs[b + 12u];

        let mainType1 = vec2<f32>(
            mainEchoBuffs[b + 13u], // echoSkill
            mainEchoBuffs[b + 14u]  // coord
        );

        let avg = evalMainPos(
            pre,
            base.setCount,
            mainAtkP / 100.0, mainAtkF, mainER,
            mainElem0, mainElem1,
            mainType0, mainType1
        );

        if (avg > best) {
            best = avg;
            bestMain = mainPos;
        }
    }

    return ComboEval(best, bestMain);
}

fn computeDamageForCombo(index: u32) -> ComboEval {
    let comboCount = u32(params.comboCount);
    if (index >= comboCount) {
        return ComboEval(0.0, 0u);
    }

    let comboIndex = comboBaseIndexU32() + index;
    let echoIds = buildEchoIds(comboIndex);
    return computeDamageForEchoIds(echoIds);
}
