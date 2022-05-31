import * as CONF from "../../config/game";
import {TT} from "../../config/textures";
import {Cell} from "../../Core/Cell";
import {SchemeGrid} from "../Scheme/SchemeGrid";
import {CellAbstract} from "./CellAbstract";
import {SpriteModel} from "../SpriteModel";
import {IPoss} from "../../Core/IPoss";
import {CellScheme} from "../../Core/CellScheme";
import {CellContent} from "./CellContent";
import {MouseClick} from "../../Core/Behaviors/MouseClick";
import {CellRoad} from "./CellRoad";

export class CellGrid extends CellAbstract {

    private cellContent;
    private cellRoad;

    constructor(position: Cell, grid: SchemeGrid) {
        super(position, grid, SpriteModel.from(TT.cell));

        this.cellContent = new CellContent(this);
        this.cellRoad = new CellRoad(this);

        this.on('click', () => { this.handleClick() });
        new MouseClick(this, this, { [MouseClick.CLICK_RIGHT]: 'handleRightClick' });
    }

    public static get defaultTexture () : string { return TT.cell; }

    handleClick() {
        this.scheme.putContent(this.grid.controlPen, this.schemePosition);
    }
    handleRightClick() { this.scheme.tapRoad(this.schemePosition); }

    get visiblePosition() { return [this.gridX + CONF.GRID_OFFSET, this.gridY + CONF.GRID_OFFSET]; }
    get schemePosition() : IPoss { return {x: this.grid.dragX + this.gridX, y: this.grid.dragY + this.gridY}; }

    get scheme() { return this.grid.scheme; }
    get schemeCell() : null | CellScheme { return this.grid.scheme.findCell(this.schemePosition) }

    refreshVisibleAll() {
        this.cellContent.updateVisibleStone();
        this.cellRoad.updateVisibleRoad();
    }
}