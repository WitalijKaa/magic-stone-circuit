import * as CONF from "../../config/game";
import {CellGrid} from "./CellGrid";

export class CellContent {

    private isStoneDrawn: boolean = false;

    constructor(private cell: CellGrid) { }

    public updateVisibleStone() : void {
        if (this.cell.schemeCell?.stone) {
            this.cell.changeTexture(CONF.CONTENT_SPRITES[this.cell.schemeCell.stone]);
            this.isStoneDrawn = true;
        }
        else if (this.isStoneDrawn) {
            this.cell.changeTexture(CellGrid.defaultTexture);
            this.isStoneDrawn = false;
        }
    }

}