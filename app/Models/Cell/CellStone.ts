import {CellGrid} from "./CellGrid";
import {TT} from "../../config/textures";
import {ST_STONE_INDIGO, ST_STONE_ORANGE, ST_STONE_RED, ST_STONE_VIOLET, STONE_TYPE_TO_ROAD_COLOR} from "../../config/game";
import {ICellWithStone} from "../../Core/Interfaces/ICellWithStone";
import {CellStoneType} from "../../Core/Types/CellStone";
import {CellGhost} from "./CellGhost";

const CONTENT_SPRITES = {
    [ST_STONE_VIOLET]: TT.stoneV,
    [ST_STONE_RED]: TT.stoneR,
    [ST_STONE_INDIGO]: TT.stoneI,
    [ST_STONE_ORANGE]: TT.stoneO,
};
const CONTENT_SPRITES_GHOSTS = {
    [ST_STONE_VIOLET]: TT.ghostStoneV,
    [ST_STONE_RED]: TT.ghostStoneR,
    [ST_STONE_INDIGO]: TT.ghostStoneI,
    [ST_STONE_ORANGE]: TT.ghostStoneO,
};

export class CellStone {

    private ghost: null | ICellWithStone = null;
    private isStoneDrawn: boolean = false;

    constructor(private cell: CellGrid | CellGhost) { }

    public get schemeCode() : string { return 'content'; }

    public update() : void {
        if (this.schemeCell) {
            this.cell.changeTexture(this.stoneTexture);
            this.isStoneDrawn = true;
        }
        else if (this.isStoneDrawn) {
            this.cell.changeTexture(this.cell.defaultTexture);
            this.isStoneDrawn = false;
        }
    }

    private get stoneTexture(): string {
        if (!this.ghost) {
            return CONTENT_SPRITES[this.schemeCell!];
        }
        return CONTENT_SPRITES_GHOSTS[this.schemeCell!]
    }

    private get schemeCell() : null | CellStoneType {
        if (!this.ghost) { return this.cell.schemeCell ? this.cell.schemeCell.stone : null; }
        return this.ghost.content.type;
    }

    public set asGhost(cell: ICellWithStone) { this.ghost = cell; }

    public killGhost() : void { this.cell.changeTexture(this.cell.defaultTexture); }
}
