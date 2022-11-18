import {CellGrid} from "./CellGrid";
import * as CONF from "../../config/game";
import {TT} from "../../config/textures";
import {ICellWithTrigger} from "../../Core/Interfaces/ICellWithTrigger";
import {CellTrigger as TriggerType} from "../../Core/Types/CellTrigger";
import {CellGhost} from "./CellGhost";

export class CellTrigger {

    private ghost: null | ICellWithTrigger = null;

    private isDrawn: boolean = false;

    constructor(private cell: CellGrid | CellGhost) { }

    public update() : void {
        let schemeCell = this.schemeCell;
        if (schemeCell) {
            let color = schemeCell.color;
            if (!color) {
                this.cell.changeTexture(TT.trigger);
            }
            else {
                this.cell.changeTexture(CONF.TRIGGER_SPRITES[color]);
            }
            this.isDrawn = true;
        }
        else if (this.isDrawn) {
            this.cell.changeTexture(this.cell.defaultTexture);
            this.isDrawn = false;
        }
    }

    private get schemeCell() : null | TriggerType {
        if (!this.ghost) { return this.cell.schemeCell ? this.cell.schemeCell.trigger : null; }
        return this.ghost.trigger;
    }

    public set asGhost(cell: ICellWithTrigger) { this.ghost = cell; }

    public killGhost() : void { this.cell.changeTexture(this.cell.defaultTexture); }

}