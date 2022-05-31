import * as CONF from "../../config/game";
import {CellGrid} from "./CellGrid";

export class CellContent {

    isStone = false;

    constructor(private cell: CellGrid) { }

    public updateVisibleStone() : void {
        if (this.cell.schemeCell?.stone) {
            this.cell.changeTexture(CONF.CONTENT_SPRITES[this.cell.schemeCell.stone]);
            this.isStone = true;
        }
        else if (this.isStone) {
            this.cell.changeTexture(CellGrid.defaultTexture);
            this.isStone = false;
        }
    }

}