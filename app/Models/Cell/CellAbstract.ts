import * as CONF from "../../config/game";
import {SpriteModel} from "../SpriteModel";
import {Cell} from "../../Core/Cell";
import {SchemeGrid} from "../Scheme/SchemeGrid";
import {Sprite} from '@pixi/sprite';

export class CellAbstract extends SpriteModel {

    constructor(private gridPosition: Cell, protected grid: SchemeGrid, sprite: Sprite) {
        super(sprite);
    }

    setSize(px: number) : CellAbstract {
        this.w = this.h = px;
        return this;
    }

    setPosition(gridX: number, gridY: number) : CellAbstract {
        this.gridPosition.x = gridX - CONF.GRID_OFFSET;
        this.gridPosition.y = gridY - CONF.GRID_OFFSET;
        this.updatePosition();
        return this;
    }

    updatePosition() : CellAbstract {
        this.x = this.gridPosition.x * this.w + this.grid.offsetX;
        this.y = this.gridPosition.y * this.h + this.grid.offsetY;
        return this;
    }

    get gridX() { return this.gridPosition.x; }
    get gridY() { return this.gridPosition.y; }
}