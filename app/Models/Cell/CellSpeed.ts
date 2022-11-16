import {CellGrid} from "./CellGrid";
import {TT} from "../../config/textures";
import {SpriteModel} from "../SpriteModel";
import {COLOR_IX_STR} from "../../config/game";
import {DirSide} from "../../Core/Types/DirectionSide";
import * as CONF from "../../config/game";

export class CellSpeed {

    constructor(private cell: CellGrid) { }

    private content: null | SpriteModel = null;
    private lastDir: DirSide = 'Right';
    private lastTextureName!: string;

    public updateVisibleSpeed() : void {
        if (this.cell.schemeCell?.speed) {
            let textureName = this.cell.schemeCell.speed.color ? 'speed' + COLOR_IX_STR[this.cell.schemeCell.speed.color] : 'speed';

            if (!this.content) {
                this.content = new SpriteModel(TT[textureName]);
                this.content.centeredPivot = true;
                this.cell.model.addChild(this.content.model);
                this.lastTextureName = textureName;
            }
            if (textureName != this.lastTextureName) {
                this.content.changeTexture(TT[textureName]);
            }

            if (this.lastDir != this.cell.schemeCell.speed.to) {
                this.lastDir = this.cell.schemeCell.speed.to;
                this.content.model.angle = CONF.ROTATE_FOR_ORIGINAL_RIGHT[this.lastDir];
            }
        }
        else if (this.content) {
            this.content.destroy();
            this.lastDir = 'Right';
            this.content = null;
        }
    }
}