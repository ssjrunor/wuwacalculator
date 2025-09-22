import {applyPheobeLogic, pheobeBuffsLogic, pheobeMultipliers} from './1506.js';
import {applySanhuaLogic, sanhuaBuffsLogic} from './1102.js';
import {applyBaizhiLogic, baizhiBuffsLogic, baizhiMultipliers} from './1103.js';
import {applyLingyangLogic, lingBuffsLogic, lingYangMultipliers} from "./1104.js";
import {applyLupaLogic, lupaBuffsLogic} from "./1207.js";
import {applyZhezhiLogic, zhezhiBuffsLogic, zhezhiMultipliers} from "./1105.js";
import {applyYouhuLogic, youhuBuffsLogic, youhuMultipliers} from "./1106.js";
import {applyCarlottaLogic, carlottaBuffsLogic, carlottaMultipliers} from "./1107.js";
import {applyCartethyiaLogic, cartBuffsLogic, cartethyiaMultipliers} from "./1409.js";
import {applyChixiaLogic, chixiaBuffsLogic, chixiaMultipliers} from "./1202.js";
import {applyEncoreLogic, encoreBuffsLogic, encoreMultipliers} from "./1203.js";
import {applyMortefiLogic, mortefiBuffsLogic, mortefiMultipliers} from "./1204.js";
import {applyChangliLogic, changliBuffsLogic} from "./1205.js";
import {applyBrantLogic, brantBuffsLogic, brantMultipliers} from "./1206.js";
import {applyCalcharoLogic, calcBuffsLogic, calcharoMultipliers} from "./1301.js";
import {applyYinlinLogic, yinlinBuffsLogic, yinlinMultipliers} from "./1302.js";
import {applyYuanwuLogic, yuanwuBuffsLogic, yuanwuMultipliers} from "./1303.js";
import {applyJinhsiLogic, jinhsiBuffsLogic} from "./1304.js";
import {applyYaoLogic, yaoBuffsLogic, yaoMultipliers} from "./1305.js";
import {applyZaniLogic, zaniBuffsLogic, zaniMultipliers} from "./1507.js";
import {applyYangLogic, yangBuffsLogic} from "./1402.js";
import {applyJiyanLogic, jiyanBuffsLogic, jiyanMultipliers} from "./1404.js";
import {applyJianxinLogic, jianxinBuffsLogic, jianxinMultipliers} from "./1405.js";
import {applyAeroRoverMLogic, aeroRoverMMultipliers} from "./1406.js";
import {ciacconaBuffsLogic, applyCiacconaLogic, ciacconaMultipliers} from "./1407.js";
import {applySpectroMLogic, spectroMBuffsLogic, spectroMMultipliers} from "./1501.js";
import {applyVerinaLogic, verinaMultipliers, verinauffsLogic} from "./1503.js";
import {applyLumiLogic, lumiBuffsLogic} from "./1504.js";
import {applySkLogic, SKBuffsLogic, skMultipliers} from "./1505.js";
import {applyTaoqiLogic, taoqiBuffsLogic, taoqiMultipliers} from "./1601.js";
import {applyDanjinLogic, danjinBuffsLogic, danjinMultipliers} from "./1602.js";
import {applyCamellyaLogic, camBuffsLogic, cammellyaMultipliers} from "./1603.js";
import {applyHavocWLogic, havocWBuffsLogic, havocWMultipliers} from "./1604.js";
import {applyRocciaLogic, rocciaBuffsLogic, rocciaMultipliers} from "./1606.js";
import {applyCantLogic, cantBuffsLogic, cantMultipliers} from "./1607.js";
import {applyAaltoLogic, aaltoMultipliers, aaltoBuffsLogic} from "./1403.js";
import {applyPhrolovaLogic, phrolovaBuffsLogic, phrolovaMultipliers} from "./1608.js";
import {applyAugustaLogic, augustaBuffsLogic, augustaMultipliers} from "./1306.js";
import {applyIunoLogic, iunoBuffsLogic, iunoMultipliers} from "./1410.js";
import {applyQYLogic, QYBuffsLogic, qyMultipliers} from "./1411.js";
import {applyGalbrenaLogic, GalbrenaBuffsLogic, galbrenaMultipliers} from "./1208.js";

const overrides = {
    '1506': {
        logic: applyPheobeLogic,
        multipliers: pheobeMultipliers,
        buffsLogic: pheobeBuffsLogic
    },
    '1102': {
        logic: applySanhuaLogic,
        buffsLogic: sanhuaBuffsLogic,
    },
    '1103': {
        logic: applyBaizhiLogic,
        multipliers: baizhiMultipliers,
        buffsLogic: baizhiBuffsLogic
    },
    "1104": {
        logic: applyLingyangLogic,
        multipliers: lingYangMultipliers,
        buffsLogic: lingBuffsLogic
    },
    "1207": {
        logic: applyLupaLogic,
        buffsLogic: lupaBuffsLogic
    },
    "1105": {
        logic: applyZhezhiLogic,
        multipliers: zhezhiMultipliers,
        buffsLogic: zhezhiBuffsLogic
    },
    "1106": {
        logic: applyYouhuLogic,
        multipliers: youhuMultipliers,
        buffsLogic: youhuBuffsLogic
    },
    "1107": {
        logic: applyCarlottaLogic,
        multipliers: carlottaMultipliers,
        buffsLogic: carlottaBuffsLogic
    },
    "1409": {
        logic: applyCartethyiaLogic,
        multipliers: cartethyiaMultipliers,
        buffsLogic: cartBuffsLogic
    },
    "1202": {
        logic: applyChixiaLogic,
        multipliers: chixiaMultipliers,
        buffsLogic: chixiaBuffsLogic
    },
    "1203": {
        logic: applyEncoreLogic,
        multipliers: encoreMultipliers,
        buffsLogic: encoreBuffsLogic
    },
    "1204": {
        logic: applyMortefiLogic,
        multipliers: mortefiMultipliers,
        buffsLogic: mortefiBuffsLogic
    },
    "1205": {
        logic: applyChangliLogic,
        buffsLogic: changliBuffsLogic
    },
    "1206": {
        logic: applyBrantLogic,
        multipliers: brantMultipliers,
        buffsLogic: brantBuffsLogic
    },
    "1301": {
        logic: applyCalcharoLogic,
        multipliers: calcharoMultipliers,
        buffsLogic: calcBuffsLogic
    },
    "1302": {
        logic: applyYinlinLogic,
        multipliers: yinlinMultipliers,
        buffsLogic: yinlinBuffsLogic
    },
    "1303": {
        logic: applyYuanwuLogic,
        multipliers: yuanwuMultipliers,
        buffsLogic: yuanwuBuffsLogic,
    },
    "1304": {
        logic: applyJinhsiLogic,
        buffsLogic: jinhsiBuffsLogic
    },
    "1305": {
        logic: applyYaoLogic,
        multipliers: yaoMultipliers,
        buffsLogic: yaoBuffsLogic,
    },
    "1507": {
        logic: applyZaniLogic,
        multipliers: zaniMultipliers,
        buffsLogic: zaniBuffsLogic
    },
    "1402": {
        logic: applyYangLogic,
        buffsLogic: yangBuffsLogic
    },
    "1403": {
        logic: applyAaltoLogic,
        multipliers: aaltoMultipliers,
        buffsLogic: aaltoBuffsLogic
    },
    "1404": {
        logic: applyJiyanLogic,
        multipliers: jiyanMultipliers,
        buffsLogic: jiyanBuffsLogic
    },
    "1405": {
        logic: applyJianxinLogic,
        multipliers: jianxinMultipliers,
        buffsLogic: jianxinBuffsLogic
    },
    "1406": {
        logic: applyAeroRoverMLogic,
        multipliers: aeroRoverMMultipliers
    },
    "1408": {
        logic: applyAeroRoverMLogic,
        multipliers: aeroRoverMMultipliers
    },
    "1407": {
        logic: applyCiacconaLogic,
        multipliers: ciacconaMultipliers,
        buffsLogic: ciacconaBuffsLogic
    },
    "1501": {
        logic: applySpectroMLogic,
        multipliers: spectroMMultipliers,
        buffsLogic: spectroMBuffsLogic
    },
    "1502": {
        logic: applySpectroMLogic,
        multipliers: spectroMMultipliers,
        buffsLogic: spectroMBuffsLogic
    },
    "1503": {
        logic: applyVerinaLogic,
        multipliers: verinaMultipliers,
        buffsLogic: verinauffsLogic
    },
    "1504": {
        logic: applyLumiLogic,
        buffsLogic: lumiBuffsLogic
    },
    "1505": {
        logic: applySkLogic,
        multipliers: skMultipliers,
        buffsLogic: SKBuffsLogic
    },
    "1601": {
        logic: applyTaoqiLogic,
        multipliers: taoqiMultipliers,
        buffsLogic: taoqiBuffsLogic
    },
    "1602": {
        logic: applyDanjinLogic,
        multipliers: danjinMultipliers,
        buffsLogic: danjinBuffsLogic
    },
    "1603": {
        logic: applyCamellyaLogic,
        multipliers: cammellyaMultipliers,
        buffsLogic: camBuffsLogic
    },
    "1604": {
        logic: applyHavocWLogic,
        multipliers: havocWMultipliers,
        buffsLogic: havocWBuffsLogic
    },
    "1605": {
        logic: applyHavocWLogic,
        multipliers: havocWMultipliers,
        buffsLogic: havocWBuffsLogic
    },
    "1606": {
        logic: applyRocciaLogic,
        multipliers: rocciaMultipliers,
        buffsLogic: rocciaBuffsLogic
    },
    "1607": {
        logic: applyCantLogic,
        multipliers: cantMultipliers,
        buffsLogic: cantBuffsLogic
    },
    "1608": {
        logic: applyPhrolovaLogic,
        multipliers: phrolovaMultipliers,
        buffsLogic: phrolovaBuffsLogic
    },
    "1306": {
        logic: applyAugustaLogic,
        multipliers: augustaMultipliers,
        buffsLogic: augustaBuffsLogic
    },
    "1410": {
        logic: applyIunoLogic,
        multipliers: iunoMultipliers,
        buffsLogic: iunoBuffsLogic,
    },
    "1411": {
        logic: applyQYLogic,
        multipliers: qyMultipliers,
        buffsLogic: QYBuffsLogic,
        //skillMetaBuffsLogic: QYSkillMetaBuffsLogic
    },
    "1208": {
        logic: applyGalbrenaLogic,
        multipliers: galbrenaMultipliers,
        buffsLogic: GalbrenaBuffsLogic,
    },
};

export function getCharacterOverride(charId) {
    return overrides[String(charId)]?.logic ?? null;
}

export function getHardcodedMultipliers(charId) {
    return overrides[String(charId)]?.multipliers ?? {};
}

export function getBuffsLogic(charId) {
    return overrides[String(charId)]?.buffsLogic ?? null;
}

export function skillMetaBuffsLogic(charId) {
    return overrides[String(charId)]?.skillMetaBuffsLogic ?? null;
}