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
import AemeathUI, {AemeathSequenceToggles, CustomInherentSkills as AemeathInherents} from "./1210.jsx";
import LuukUI, {LuukSequenceToggles, CustomInherentSkills as LuukInherents} from "./1510.jsx";
import SigrikaUI, {CustomInherentSkills as SigrikaInherents, sigrikaSequenceToggles} from "@/data/characters/ui/1412.jsx";


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
        case '1210': return AemeathUI;
        case '1510': return LuukUI;
        case '1412': return SigrikaUI;
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
        case '1210': return AemeathInherents;
        case '1510': return LuukInherents;
        case '1412': return SigrikaInherents;
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
        case '1210': return AemeathSequenceToggles;
        case '1510': return LuukSequenceToggles;
        case '1412': return sigrikaSequenceToggles;
        default: return null;
    }
}

const characterBuffModules = import.meta.glob('./*.jsx', { eager: true });

const characterBuffUIMap = Object.entries(characterBuffModules).reduce((accumulator, [path, module]) => {
    const id = path.match(/\/(\d+)\.jsx$/)?.[1];
    if (id) {
        accumulator[id] = module?.buffUI ?? null;
    }
    return accumulator;
}, {});

characterBuffUIMap['1502'] = characterBuffUIMap['1501'] ?? null;
characterBuffUIMap['1605'] = characterBuffUIMap['1604'] ?? null;

export async function loadCharacterBuffUI(charId) {
    return characterBuffUIMap[String(charId)] ?? null;
}
