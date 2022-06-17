import {CellGrid} from "./CellGrid";
import {TT} from "../../config/textures";

export class CellSmile {

    private isSmileDrawn: boolean = false;

    constructor(private cell: CellGrid) { }

    public updateVisibleSprites() : void {
        let cell = this.cell.schemeCell;
        if (cell?.smile && cell.smile.view) {
            if (!this.isSmileDrawn) {
                this.cell.changeTexture(TT.smile);
                this.cell.setColor(0x37474f);
                this.cell.twiceSize = true;
                this.isSmileDrawn = true;
                // @ts-ignore
                //this.cell.model.scale = 2;
                // this.cell.setSize(80);
                // this.cell.model.anchor.set(0.5, 0.5);
            }
        }
        else if (this.isSmileDrawn) {
            this.cell.twiceSize = false;
            this.cell.changeTexture(CellGrid.defaultTexture);
            this.cell.setColor(null);
            this.isSmileDrawn = false;
        }
    }

}