import * as CONF from "../../config/game";
import {CellGrid} from "./CellGrid";
import {TT} from "../../config/textures";
import {STONE_TYPE_TO_ROAD_COLOR} from "../../config/game";

export class CellContent {

    private isStoneDrawn: boolean = false;
    private isColored: boolean = false; // its only for switcher, not for stone

    constructor(private cell: CellGrid) { }

    public updateVisibleStone() : void {
        if (this.isColored) {
            this.cell.setColor(null);
            this.isColored = false;
        }

        if (this.cell.schemeCell?.stone) {
            if (!this.cell.schemeCell.isSwitcher) {
                this.cell.changeTexture(CONF.CONTENT_SPRITES[this.cell.schemeCell.stone]);
            }
            else {
                this.cell.changeTexture(TT.switcher);
                this.cell.setColor(STONE_TYPE_TO_ROAD_COLOR[this.cell.schemeCell.stone]);
                this.isColored = true;
            }
            this.isStoneDrawn = true;
        }
        else if (this.isStoneDrawn) {
            this.cell.changeTexture(CellGrid.defaultTexture);
            this.isStoneDrawn = false;
        }
    }

}