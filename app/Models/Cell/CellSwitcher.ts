import {CellGrid} from "./CellGrid";
import {TT} from "../../config/textures";
import {STONE_TYPE_TO_ROAD_COLOR} from "../../config/game";
import {ICellWithStone} from "../../Core/Interfaces/ICellWithStone";
import {CellStoneType} from "../../Core/Types/CellStone";
import {CellGhost} from "./CellGhost";

export class CellSwitcher {

    private ghost: null | ICellWithStone = null;
    private isStoneDrawn: boolean = false;

    constructor(private cell: CellGrid | CellGhost) { }

    public get schemeCode() : string { return 'switcher'; }

    public update() : void {
        if (this.cell.schemeCell?.switcher) {
            this.cell.changeTexture(TT.switcher);
            this.cell.setColor(STONE_TYPE_TO_ROAD_COLOR[this.cell.schemeCell.switcher.type]);
            this.isStoneDrawn = true;
        }
        else if (this.isStoneDrawn) {
            this.cell.setColor(null);
            this.cell.changeTexture(this.cell.defaultTexture);
            this.isStoneDrawn = false;
        }
    }
}
