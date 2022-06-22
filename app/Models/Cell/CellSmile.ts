import {CellGrid} from "./CellGrid";
import {TT} from "../../config/textures";
import {COLOR_DARK_SMILE} from "../../config/game";

export class CellSmile {

    private isSmileDrawn: boolean = false;

    constructor(private cell: CellGrid) { }

    public updateVisibleSprites() : void {
        let cell = this.cell.schemeCell;
        if (cell?.smile && cell.smile.view) {
            if (!this.isSmileDrawn) {
                this.cell.changeTexture(TT.smile);
                this.cell.twiceSize = true;
                this.isSmileDrawn = true;
            }
            this.cell.setColor(cell.smile.color ? cell.smile.color : COLOR_DARK_SMILE);
        }
        else if (this.isSmileDrawn) {
            this.cell.twiceSize = false;
            this.cell.changeTexture(CellGrid.defaultTexture);
            this.cell.setColor(null);
            this.isSmileDrawn = false;
        }
    }

}