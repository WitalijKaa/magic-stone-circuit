import {CellStoneCopy} from "./CellStone";
import {CellRoadType} from "./CellRoad";
import {CellSemiconductorDirection, CellSemiconductorType} from "./CellSemiconductor";
import {CellScheme} from "../CellScheme";
import {CellSmileCopy} from "./CellSmile";

export type SchemeStructure = { [keyX: number]: { [keyY: number]: null | CellScheme } };

export type SchemeCopy = { [keyX: number]: { [keyY: number]:
    { c: CellStoneCopy } |
    { r: { t: CellRoadType, p: string } } |
    { s: { t: CellSemiconductorType, d: CellSemiconductorDirection } } |
    { i: CellSmileCopy }
} }