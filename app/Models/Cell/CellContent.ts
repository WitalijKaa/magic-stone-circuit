import * as CONF from "../../config/game";
import {CellGrid} from "./CellGrid";

export class CellContent {

    constructor(private cell: CellGrid) { }

    updateVisibleStone() : void {
        if (this.cell.schemeCell?.stone) {
            this.cell.changeTexture(CONF.CONTENT_SPRITES[this.cell.schemeCell.stone])
        }
        else {
            this.cell.changeTexture(CellGrid.defaultTexture)
        }
    }

}