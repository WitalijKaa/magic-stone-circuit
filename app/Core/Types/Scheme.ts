import {CellStoneCopy} from "./CellStone";
import {CellRoadType} from "./CellRoad";
import {CellSemiconductorDirection, CellSemiconductorType} from "./CellSemiconductor";
import {CellScheme} from "../CellScheme";
import {CellSmileCopy} from "./CellSmile";
import {ICellWithStone} from "../Interfaces/ICellWithStone";
import {ICellWithRoad} from "../Interfaces/ICellWithRoad";
import {ICellWithSemiconductor} from "../Interfaces/ICellWithSemiconductor";
import {ICellWithSmile} from "../Interfaces/ICellWithSmile";
import {ICellWithTrigger} from "../Interfaces/ICellWithTrigger";
import {CellTriggerCopy} from "./CellTrigger";
import {CellSpeedCopy} from "./CellSpeed";
import {ICellWithSpeed} from "../Interfaces/ICellWithSpeed";
import {ICellWithSwitcher} from "../Interfaces/ICellWithSwitcher";
import {CellSwitcherCopy} from "./CellSwitcher";
import {ICellWithGen} from "../Interfaces/ICellWithGen";
import {CellGenCopy} from "./CellGen";

export type SchemeCellStructure = null | ICellWithStone | ICellWithRoad | ICellWithSemiconductor | ICellWithTrigger | ICellWithSpeed | ICellWithGen | ICellWithSwitcher | ICellWithSmile;
export type SchemeStructure = { [keyX: number]: { [keyY: number]: SchemeCellStructure } };
export type SchemeInstanceStructure = { [keyX: number]: { [keyY: number]: null | CellScheme } };

export type SchemeCopyCell = { c: CellStoneCopy } |
    { h: CellSwitcherCopy } |
    { r: { t: CellRoadType, p: string } } |
    { s: { t: CellSemiconductorType, d: CellSemiconductorDirection } } |
    { t: CellTriggerCopy } |
    { f: CellSpeedCopy } |
    { g: CellGenCopy } |
    { i: CellSmileCopy };

export type SchemeCopy = { [keyX: number]: { [keyY: number]: SchemeCopyCell } }