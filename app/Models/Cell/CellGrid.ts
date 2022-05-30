import * as CONF from "../../config/game";
import {TT} from "../../config/textures";
import {Cell} from "../../Core/Cell";
import {SchemeGrid} from "../Scheme/SchemeGrid";
import {CellAbstract} from "./CellAbstract";
import {SpriteModel} from "../SpriteModel";
import {IPoss} from "../../Core/IPoss";
import {CellScheme} from "../../Core/CellScheme";
import {CellContent} from "./CellContent";

export class CellGrid extends CellAbstract {

    private cellContent;

    constructor(position: Cell, grid: SchemeGrid) {
        super(position, grid, SpriteModel.from(TT.cell));

        this.cellContent = new CellContent(this);

        this.on('click', () => { this.handleClick() });
    }

    public static get defaultTexture () : string { return TT.cell; }

    handleClick() {
        this.scheme.putContent(this.grid.controlPen, this.schemePosition);
    }

    get visiblePosition() { return [this.gridX + CONF.GRID_OFFSET, this.gridY + CONF.GRID_OFFSET]; }
    get schemePosition() : IPoss { return {x: this.grid.dragX + this.gridX, y: this.grid.dragY + this.gridY}; }

    get scheme() { return this.grid.scheme; }
    get schemeCell() : null | CellScheme { return this.grid.scheme.findCell(this.schemePosition) }

    refreshVisibleAll() {
        this.updateVisibleContent();
    }

    updateVisibleContent() {
        this.cellContent.updateVisibleStone();
    }
}