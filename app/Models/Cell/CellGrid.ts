import {Cell} from "../../Core/Cell";
import {SchemeGrid} from "../Scheme/SchemeGrid";
import {CellAbstract} from "./CellAbstract";
import {TT} from "../../config/textures";
import {SpriteModel} from "../SpriteModel";
import {ST_STONE_ORANGE} from "../../config/pixi";
import {GRID_OFFSET} from "../../config/params";
import {Poss} from "../../Core/Poss";
import {IPoss} from "../../Core/IPoss";
import {CellScheme} from "../../Core/CellScheme";

export class CellGrid extends CellAbstract {

    constructor(position: Cell, grid: SchemeGrid) {
        super(position, grid, SpriteModel.from(TT.cell));

        this.on('click', () => { this.handleClick() });
    }

    handleClick() {
        this.scheme.putContent(ST_STONE_ORANGE, this.schemePosition);
    }

    get visiblePosition() { return [this.gridX + GRID_OFFSET, this.gridY + GRID_OFFSET]; }
    get schemePosition() : IPoss { return {x: this.grid.dragX + this.gridX, y: this.grid.dragY + this.gridY}; }

    get scheme() { return this.grid.scheme; }
    get schemeCell() : null | CellScheme { return this.grid.scheme.findCell(this.schemePosition) }

    refreshVisibleAll() : void {
        console.log(this)
    }
}