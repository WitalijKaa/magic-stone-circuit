import {CellStoneCopy} from "./CellStone";
import {CellRoadType} from "./CellRoad";
import {CellSemiconductorDirection, CellSemiconductorType} from "./CellSemiconductor";
import {CellScheme} from "../CellScheme";
import {CellSmileCopy} from "./CellSmile";
import {ICellWithContent} from "../Interfaces/ICellWithContent";
import {ICellWithRoad} from "../Interfaces/ICellWithRoad";
import {ICellWithSemiconductor} from "../Interfaces/ICellWithSemiconductor";
import {ICellWithSmile} from "../Interfaces/ICellWithSmile";
import {ICellWithTrigger} from "../Interfaces/ICellWithTrigger";
import {CellTriggerCopy} from "./CellTrigger";
import {CellSpeedCopy} from "./CellSpeed";
import {ICellWithSpeed} from "../Interfaces/ICellWithSpeed";

export type SchemeCellStructure = null | ICellWithContent | ICellWithRoad | ICellWithSemiconductor | ICellWithTrigger | ICellWithSpeed | ICellWithSmile;
export type SchemeStructure = { [keyX: number]: { [keyY: number]: SchemeCellStructure } };
export type SchemeInstanceStructure = { [keyX: number]: { [keyY: number]: null | CellScheme } };

export type SchemeCopyCell = { c: CellStoneCopy } |
    { r: { t: CellRoadType, p: string } } |
    { s: { t: CellSemiconductorType, d: CellSemiconductorDirection } } |
    { t: CellTriggerCopy } |
    { f: CellSpeedCopy } |
    { i: CellSmileCopy };
export type SchemeCopy = { [keyX: number]: { [keyY: number]: SchemeCopyCell } }