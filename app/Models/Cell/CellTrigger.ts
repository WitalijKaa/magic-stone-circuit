import {CellGrid} from "./CellGrid";
import * as CONF from "../../config/game";
import {TT} from "../../config/textures";
import {STONE_TYPE_TO_ROAD_COLOR} from "../../config/game";

export class CellTrigger {

    constructor(private cell: CellGrid) { }

    private isTriggerDrawn: boolean = false;

    public updateVisibleTrigger() : void {
        if (this.cell.schemeCell?.trigger) {
            let color = this.cell.schemeCell.trigger.color;
            if (!color) {
                this.cell.changeTexture(TT.triggerNull);
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