import {CellStoneType} from "./CellStone";

export type CellSwitcher = {
    type: CellStoneType,
    range: Array<CellStoneType>,
};

export type CellSwitcherCopy = {
    t: CellStoneType,
    r: Array<CellStoneType>,
};