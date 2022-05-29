import {SpriteModel} from "../SpriteModel";
import {GRID_OFFSET} from "../../config/params";
import {Cell} from "../../Core/Cell";
import {SchemeGrid} from "../Scheme/SchemeGrid";
import {Sprite} from "pixi.js";

export class CellAbstract extends SpriteModel {

    private gridPosition: Cell;
    protected grid: SchemeGrid;

    constructor(position: Cell, grid: SchemeGrid, sprite: Sprite) {
        super(sprite);
        this.gridPosition = position;
        this.grid = grid;
    }

    setSize(px: number) : CellAbstract {
        this.w = this.h = px;
        return this;
    }

    setPosition(gridX: number, gridY: number) : CellAbstract {
        this.gridPosition.x = gridX - GRID_OFFSET;
        this.gridPosition.y = gridY - GRID_OFFSET;
        this.updatePosition();
        return this;
    }

    updatePosition() : CellAbstract {
        this.x = this.gridPosition.x * this.w + this.grid.offsetX;
        this.y = this.gridPosition.y * this.h + this.grid.offsetY;
        return this;
    }

}