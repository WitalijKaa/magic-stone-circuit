import {CellGrid} from "./CellGrid";
import * as CONF from "../../config/game";
import {TT} from "../../config/textures";

export class CellTrigger {

    constructor(private cell: CellGrid) { }

    private isTriggerDrawn: boolean = false;

    public updateVisibleTrigger() : void {
        if (this.cell.schemeCell?.trigger) {
            let color = this.cell.schemeCell.trigger.color;
            console.log(color);
            if (!color) {
                this.cell.changeTexture(TT.trigger);
            }
            else {
                this.cell.changeTexture(CONF.TRIGGER_SPRITES[color]);
            }
            this.isTriggerDrawn = true;
        }
        else if (this.isTriggerDrawn) {
            this.cell.changeTexture(CellGrid.defaultTexture);
            this.isTriggerDrawn = false;
        }
    }
}