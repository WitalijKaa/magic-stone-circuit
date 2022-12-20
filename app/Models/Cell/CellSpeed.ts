import {CellGrid} from "./CellGrid";
import {TT} from "../../config/textures";
import {SpriteModel} from "../SpriteModel";
import {COLOR_IX_STR} from "../../config/game";
import {DirSide} from "../../Core/Types/DirectionSide";
import * as CONF from "../../config/game";
import {ICellWithSpeed} from "../../Core/Interfaces/ICellWithSpeed";
import {CellSpeed as SpeedType} from "../../Core/Types/CellSpeed";
import {CellGhost} from "./CellGhost";

export class CellSpeed {

    private ghost: null | ICellWithSpeed = null;

    private content: null | SpriteModel = null;
    private lastDir: DirSide = 'Right';
    private lastTextureName!: string;

    constructor(private cell: CellGrid | CellGhost) { }

    public get schemeCode() : string { return 'speed'; }

    public update() : void {
        let schemeCell = this.schemeCell;
        if (schemeCell) {
            let textureName = schemeCell.color ? 'speed' + COLOR_IX_STR[schemeCell.color] :
                (this.ghost ? 'ghostSpeed' : 'speed');

            if (!this.content) {
                this.content = new SpriteModel(TT[textureName]);
                this.content.centeredPivot = true;
                this.cell.model.addChild(this.content.model);
                this.lastTextureName = textureName;
            }
            if (textureName != this.lastTextureName) {
                this.content.changeTexture(TT[textureName]);
                this.lastTextureName = textureName;
            }

            if (this.lastDir != schemeCell.to) {
                this.lastDir = schemeCell.to;
                this.content.model.angle = CONF.ROTATE_FOR_ORIGINAL_RIGHT[this.lastDir];
            }
        }
        else if (this.content) {
            this.content.destroy();
            this.lastDir = 'Right';
            this.content = null;
        }
    }

    private get schemeCell() : null | SpeedType {
        if (!this.ghost) { return this.cell.schemeCell ? this.cell.schemeCell.speed : null; }
        return this.ghost.speed;
    }

    public set asGhost(cell: ICellWithSpeed) { this.ghost = cell; }

    public killGhost() : void { this.content?.destroy(); }
}