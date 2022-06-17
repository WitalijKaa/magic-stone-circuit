export type CellStoneType = 1 | 2 | 3 | 4;

export type CellStone = {
    type: CellStoneType,
    range: Array<CellStoneType>,
};