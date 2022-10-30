import {CellStoneCopy} from "./CellStone";
import {CellRoadType} from "./CellRoad";
import {CellSemiconductorDirection, CellSemiconductorType} from "./CellSemiconductor";
import {CellScheme} from "../CellScheme";
import {CellSmileCopy} from "./CellSmile";
import {ICellWithContent} from "../Interfaces/ICellWithContent";
import {ICellWithRoad} from "../Interfaces/ICellWithRoad";
import {ICellWithSemiconductor} from "../Interfaces/ICellWithSemiconductor";
import {ICellWithSmile} from "../Interfaces/ICellWithSmile";

export type SchemeCellStructure = null | ICellWithContent | ICellWithRoad | ICellWithSemiconductor | ICellWithSmile;
export type SchemeStructure = { [keyX: number]: { [keyY: number]: SchemeCellStructure } };
export type SchemeInstanceStructure = { [keyX: number]: { [keyY: number]: null | CellScheme } };

export type SchemeCopy = { [keyX: number]: { [keyY: number]:
    { c: CellStoneCopy } |
    { r: { t: CellRoadType, p: string } } |
    { s: { t: CellSemiconductorType, d: CellSemiconductorDirection } } |
    { i: CellSmileCopy }
} }