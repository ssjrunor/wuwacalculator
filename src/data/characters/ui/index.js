import PheobeUI, { PheobeSequenceToggles } from './1506.jsx';
import { CustomInherentSkills as SanhuaInherents, SanhuaSequenceToggles } from './1102.jsx';
import { CustomInherentSkills as BaizhiInherents, BaizhiSequenceToggles } from './1103.jsx';
import LingYangUI, { CustomInherentSkills as LingyangInherents, LingyangSequenceToggles } from './1104.jsx';
import LupaUI, { CustomInherentSkills as LupaInherents, LupaSequenceToggles } from "./1207.jsx";
import ZhezhiUI, {CustomInherentSkills as ZhezhiInherents, ZhezhiSequenceToggles} from './1105.jsx';
import YouhuUI, {CustomInherentSkills as YouhuInherents, youhuSequenceToggles} from "./1106.jsx";
import CarlottaUI, {CarolottaSequenceToggles} from "./1107.jsx";
import CartethyiaUI, { cartethyiaSequenceToggles} from "./1409.jsx";
import {CustomInherentSkills as ChixiaInherents, chixiaSequenceToggles} from "./1202.jsx";
import {CustomInherentSkills as EncoreInherents, encoreSequenceToggles} from "./1203.jsx";
import {CustomInherentSkills as MortefiInherents, mortefiSequenceToggles} from "./1204.jsx";
import {CustomInherentSkills as ChangliInherents, changliSequenceToggles} from "./1205.jsx";
import BrantUI, {CustomInherentSkills as BrantInherents, brantSequenceToggles} from "./1206.jsx";
import  {CustomInherentSkills as CalcharoInherents, CalcharoSequenceToggles} from "./1301.jsx";
import {CustomInherentSkills as YinlinInherents, yinlinSequenceToggles} from "./1302.jsx";
import {yuanwuSequenceToggles} from "./1303.jsx";
import JinhsiUI, {jinhsiSequenceToggles} from "./1304.jsx";
import {CustomInherentSkills as YoaInherents, yoaSequenceToggles} from "./1305.jsx";
import ZaniUI, {CustomInherentSkills as ZaniInherents, zaniSequenceToggles} from "./1507.jsx";
import {CustomInherentSkills as YangINherents, yangSequenceToggles} from "./1402.jsx";
import JiyanUI, {CustomInherentSkills as JiyanInherents, jiyanSequenceToggles} from "./1404.jsx";
import {jianxinSequenceToggles} from "./1405.jsx";
import {CustomInherentSkills as AeroInherents, aeroMSequenceToggles} from "./1406.jsx";
import CiacconaUI, {ciacconaSequenceToggles} from "./1407.jsx";
import {CustomInherentSkills as SpectroInherents, spectroMSequenceToggles} from "./1501.jsx";
import VerinaUI, {CustomInherentSkills as VerinaInherents, verinaSequenceToggles} from "./1503.jsx";
import LumiUI, {CustomInherentSkills as LumiInherents, lumiSequenceToggles} from "./1504.jsx";
import SkUI, {CustomInherentSkills as SkInherents, skSequenceToggles} from "./1505.jsx";
import {CustomInherentSkills as TaoqiInherents, taoqiSequenceToggles} from "./1601.jsx";
import DanjinUI, {CustomInherentSkills as DanjinInherents, danjinSequenceToggles} from "./1602.jsx";
import CamellyaUI, {camellyaSequenceToggles} from "./1603.jsx";
import {havocWSequenceToggles, CustomInherentSkills as HavocInherents} from "./1604.jsx";
import RocciaUI, {rocciaSequenceToggles, CustomInherentSkills as RocciaInherents} from "./1606.jsx";
import {cantSequenceToggles, CustomInherentSkills as CantInherents} from "./1607.jsx";
import AaltoUI, {aaltoSequenceToggles, CustomInherentSkills as AaltoInherents} from "./1403.jsx";
import PhrolovaUI, {phrolovaSequenceToggles, CustomInherentSkills as PhrolovaInherents} from "./1608.jsx";
import AugustaUI, {AugustaSequenceToggles} from "./1306.jsx";
import IunoUI, {IunoSequenceToggles} from "./1410.jsx";
import QiuyuanUI, {QiuyuanSequenceToggles, CustomInherentSkills as QiuyuanInherents} from "./1411.jsx";
import GalbrenaUI, {GalbrenaSequenceToggles, CustomInherentSkills as GalbrenaInherents} from "./1208.jsx";
import BulingUI, {CustomInherentSkills as BulingInherents} from "./1307.jsx";
import ChisaUI, {chisaSequenceToggles, CustomInherentSkills as ChisaInherentSkills} from "./1508.jsx";
import LynaeUI, {lynaeSequenceToggles, CustomInherentSkills as LynaeInherentSkills} from "./1509.jsx";
import MornyeUI, {MornyeSequenceToggles} from "./1209.jsx";


export function getCharacterUIComponent(characterId) {
    switch (String(characterId)) {
        case '1506': return PheobeUI;
        case '1104': return LingYangUI;
        case '1207': return LupaUI
        case '1105': return ZhezhiUI;
        case '1106': return YouhuUI;
        case '1107': return CarlottaUI;
        case '1409': return CartethyiaUI;
        case '1206': return BrantUI;
        case '1304': return JinhsiUI;
        case '1507': return ZaniUI;
        case '1404': return JiyanUI;
        case '1407': return CiacconaUI;
        case '1503': return VerinaUI;
        case '1505': return SkUI;
        case '1602': return DanjinUI;
        case '1603': return CamellyaUI;
        case '1606': return RocciaUI;
        case '1403': return AaltoUI;
        case '1608': return PhrolovaUI;
        case '1306': return AugustaUI;
        case '1410': return IunoUI;
        case '1411': return QiuyuanUI;
        case '1208': return GalbrenaUI;
        case '1307': return BulingUI;
        case '1508': return ChisaUI;
        case '1509': return LynaeUI;
        case '1209': return MornyeUI;
        default: return null;
    }
}

export function getCustomInherentSkillsComponent(characterId) {
    switch (String(characterId)) {
        case '1102': return SanhuaInherents;
        case '1103': return BaizhiInherents;
        case '1104': return LingyangInherents;
        case '1207': return LupaInherents;
        case '1105': return ZhezhiInherents;
        case '1106': return YouhuInherents;
        case '1202': return ChixiaInherents;
        case '1203': return EncoreInherents;
        case '1204': return MortefiInherents;
        case '1205': return ChangliInherents;
        case '1206': return BrantInherents;
        case '1301': return CalcharoInherents;
        case '1302': return YinlinInherents;
        case '1305': return YoaInherents;
        case '1507': return ZaniInherents;
        case '1402': return YangINherents;
        case '1404': return JiyanInherents;
        case '1406': return AeroInherents;
        case '1408': return AeroInherents;
        case '1501': return SpectroInherents;
        case '1502': return SpectroInherents;
        case '1503': return VerinaInherents;
        case '1504': return LumiInherents;
        case '1505': return SkInherents;
        case '1601': return TaoqiInherents;
        case '1602': return DanjinInherents;
        case '1604': return HavocInherents;
        case '1607': return CantInherents;
        case '1403': return AaltoInherents;
        case '1608': return PhrolovaInherents;
        case '1411': return QiuyuanInherents;
        case '1208': return GalbrenaInherents;
        case '1307': return BulingInherents;
        case '1508': return ChisaInherentSkills;
        case '1509': return LynaeInherentSkills;
        default: return null;
    }
}

export function getSequenceToggleComponent(characterId) {
    switch (String(characterId)) {
        case '1506': return PheobeSequenceToggles;
        case '1102': return SanhuaSequenceToggles;
        case '1103': return BaizhiSequenceToggles;
        case '1104': return LingyangSequenceToggles;
        case '1207': return LupaSequenceToggles;
        case '1105': return ZhezhiSequenceToggles;
        case '1106': return youhuSequenceToggles;
        case '1107': return CarolottaSequenceToggles;
        case '1409': return cartethyiaSequenceToggles;
        case '1202': return chixiaSequenceToggles;
        case '1203': return encoreSequenceToggles;
        case '1204': return mortefiSequenceToggles;
        case '1205': return changliSequenceToggles;
        case '1206': return brantSequenceToggles;
        case '1301': return CalcharoSequenceToggles;
        case '1302': return yinlinSequenceToggles;
        case '1303': return yuanwuSequenceToggles;
        case '1304': return jinhsiSequenceToggles;
        case '1305': return yoaSequenceToggles;
        case '1507': return zaniSequenceToggles;
        case '1402': return yangSequenceToggles;
        case '1404': return jiyanSequenceToggles;
        case '1405': return jianxinSequenceToggles;
        case '1406': return aeroMSequenceToggles;
        case '1408': return aeroMSequenceToggles;
        case '1407': return ciacconaSequenceToggles;
        case '1501': return spectroMSequenceToggles;
        case '1502': return spectroMSequenceToggles;
        case '1503': return verinaSequenceToggles;
        case '1504': return lumiSequenceToggles;
        case '1505': return skSequenceToggles;
        case '1601': return taoqiSequenceToggles;
        case '1602': return danjinSequenceToggles;
        case '1603': return camellyaSequenceToggles;
        case '1604': return havocWSequenceToggles;
        case '1605': return havocWSequenceToggles;
        case '1606': return rocciaSequenceToggles;
        case '1607': return cantSequenceToggles;
        case '1403': return aaltoSequenceToggles;
        case '1608': return phrolovaSequenceToggles;
        case '1306': return AugustaSequenceToggles;
        case '1410': return IunoSequenceToggles;
        case '1411': return QiuyuanSequenceToggles;
        case '1208': return GalbrenaSequenceToggles;
        case '1508': return chisaSequenceToggles;
        case '1509': return lynaeSequenceToggles;
        case '1209': return MornyeSequenceToggles;
        default: return null;
    }
}

const characterBuffUIMap = {
    '1102': () => import('./1102.jsx').then(mod => mod.buffUI),
    '1103': () => import('./1103.jsx').then(mod => mod.buffUI),
    '1407': () => import('./1407.jsx').then(mod => mod.buffUI),
    '1505': () => import('./1505.jsx').then(mod => mod.buffUI),
    '1105': () => import('./1105.jsx').then(mod => mod.buffUI),
    '1506': () => import('./1506.jsx').then(mod => mod.buffUI),
    '1503': () => import('./1503.jsx').then(mod => mod.buffUI),
    '1207': () => import('./1207.jsx').then(mod => mod.buffUI),
    '1205': () => import('./1205.jsx').then(mod => mod.buffUI),
    '1206': () => import('./1206.jsx').then(mod => mod.buffUI),
    '1302': () => import('./1302.jsx').then(mod => mod.buffUI),
    '1204': () => import('./1204.jsx').then(mod => mod.buffUI),
    '1106': () => import('./1106.jsx').then(mod => mod.buffUI),
    '1202': () => import('./1202.jsx').then(mod => mod.buffUI),
    '1203': () => import('./1203.jsx').then(mod => mod.buffUI),
    '1107': () => import('./1107.jsx').then(mod => mod.buffUI),
    '1104': () => import('./1104.jsx').then(mod => mod.buffUI),
    '1301': () => import('./1301.jsx').then(mod => mod.buffUI),
    '1303': () => import('./1303.jsx').then(mod => mod.buffUI),
    '1304': () => import('./1304.jsx').then(mod => mod.buffUI),
    '1305': () => import('./1305.jsx').then(mod => mod.buffUI),
    '1402': () => import('./1402.jsx').then(mod => mod.buffUI),
    '1404': () => import('./1404.jsx').then(mod => mod.buffUI),
    '1405': () => import('./1405.jsx').then(mod => mod.buffUI),
    '1409': () => import('./1409.jsx').then(mod => mod.buffUI),
    '1501': () => import('./1501.jsx').then(mod => mod.buffUI),
    '1502': () => import('./1501.jsx').then(mod => mod.buffUI),
    '1504': () => import('./1504.jsx').then(mod => mod.buffUI),
    '1507': () => import('./1507.jsx').then(mod => mod.buffUI),
    '1601': () => import('./1601.jsx').then(mod => mod.buffUI),
    '1602': () => import('./1602.jsx').then(mod => mod.buffUI),
    '1603': () => import('./1603.jsx').then(mod => mod.buffUI),
    '1604': () => import('./1604.jsx').then(mod => mod.buffUI),
    '1605': () => import('./1604.jsx').then(mod => mod.buffUI),
    '1606': () => import('./1606.jsx').then(mod => mod.buffUI),
    '1607': () => import('./1607.jsx').then(mod => mod.buffUI),
    '1403': () => import('./1403.jsx').then(mod => mod.buffUI),
    '1608': () => import('./1608.jsx').then(mod => mod.buffUI),
    '1306': () => import('./1306.jsx').then(mod => mod.buffUI),
    '1410': () => import('./1410.jsx').then(mod => mod.buffUI),
    '1411': () => import('./1411.jsx').then(mod => mod.buffUI),
    '1208': () => import('./1208.jsx').then(mod => mod.buffUI),
    '1307': () => import('./1307.jsx').then(mod => mod.buffUI),
    '1508': () => import('./1508.jsx').then(mod => mod.buffUI),
    '1509': () => import('./1509.jsx').then(mod => mod.buffUI),
    '1209': () => import('./1209.jsx').then(mod => mod.buffUI),
};

export async function loadCharacterBuffUI(charId) {
    const loader = characterBuffUIMap[String(charId)];
    if (!loader) return null;
    return loader();
}