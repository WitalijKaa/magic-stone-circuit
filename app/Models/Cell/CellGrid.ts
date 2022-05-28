import { SpriteModel } from "../SpriteModel";
import { Cell } from "../../Core/Cell";
import { SchemeGrid } from "../Scheme/SchemeGrid";

export class CellGrid {

    sprite!: SpriteModel;
    cellPosition: Cell;
    grid: SchemeGrid;

    constructor(position: Cell, grid: SchemeGrid) {
        this.cellPosition = position;
        this.grid = grid;
    }
}