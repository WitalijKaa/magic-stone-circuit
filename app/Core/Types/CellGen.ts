import {MagicColor} from "./ColorTypes";
import {CellStoneType} from "./CellStone";

export type CellGen = {
    current: MagicColor,
    start: MagicColor,
    phases: Array<MagicColor>,
};

export type CellGenCopy = { s: CellStoneType, phases: Array<CellStoneType> };