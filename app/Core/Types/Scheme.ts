import {CellStone} from "./CellStone";
import {CellRoadType} from "./CellRoad";
import {CellSemiconductorDirection, CellSemiconductorType} from "./CellSemiconductor";
import {CellScheme} from "../CellScheme";

export type SchemeStructure = { [keyX: number]: { [keyY: number]: null | CellScheme } };

export type SchemeCopy = { [keyX: number]: { [keyY: number]:
    { content: CellStone } |
    { road: { type: CellRoadType, paths: Array<boolean> } } |
    { semiconductor: { type: CellSemiconductorType, direction: CellSemiconductorDirection } }
} }