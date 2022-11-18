import * as CONF from "../../config/game";
import {CellGrid} from "./CellGrid";
import {TT} from "../../config/textures";
import {STONE_TYPE_TO_ROAD_COLOR} from "../../config/game";
import {ICellWithContent} from "../../Core/Interfaces/ICellWithContent";
import {CellStoneType} from "../../Core/Types/CellStone";
import {CellGhost} from "./CellGhost";

export class CellContent {

    private ghost: null | ICellWithContent = null;
    private isStoneDrawn: boolean = false;
    private isColored: boolean = false; // its only for switcher, not for stone

    constructor(private cell: CellGrid | CellGhost) { }

    public update() : void {
        if (this.isColored) {
            this.cell.setColor(null);
            this.isColored = false;
        }

        if (this.schemeCell) {
            if (!this.isSwitcher) {
                this.cell.changeTexture(CONF.CONTENT_SPRITES[this.schemeCell]);
            }
            else {
                this.cell.changeTexture(TT.switcher);
                this.cell.setColor(STONE_TYPE_TO_ROAD_COLOR[this.schemeCell]);
                this.isColored = true;
            }
            this.isStoneDrawn = true;
        }
        else if (this.isStoneDrawn) {
            this.cell.changeTexture(this.cell.defaultTexture);
            this.isStoneDrawn = false;
        }
    }

    private get isSwitcher() : boolean {
        if (!this.ghost) { return this.cell.schemeCell ? this.cell.schemeCell.isSwitcher : false; }
        return false;
    }

    private get schemeCell() : null | CellStoneType {
        if (!this.ghost) { return this.cell.schemeCell ? this.cell.schemeCell.stone : null; }
        return this.ghost.content.type;
    }

    public set asGhost(cell: ICellWithContent) { this.ghost = cell; }

    public killGhost() : void { this.cell.changeTexture(this.cell.defaultTexture); }
}
