import {CellGrid} from "./CellGrid";
import {CONTENT_SPRITES} from "../../config/pixi";

export class CellContent {

    constructor(private cell: CellGrid) { }

    updateVisibleStone() : void {
        if (this.cell.schemeCell?.stone) {
            this.cell.changeTexture(CONTENT_SPRITES[this.cell.schemeCell.stone])
        }
        else {
            this.cell.changeTexture(CellGrid.defaultTexture)
        }
    }

}