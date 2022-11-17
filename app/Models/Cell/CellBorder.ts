import {CellGrid} from "./CellGrid";
import {TT} from "../../config/textures";
import {SpriteModel} from "../SpriteModel";

export class CellBorder {

    constructor(private cell: CellGrid) { }

    private content: null | SpriteModel = null;
    private lastTextureName!: string;

    public updateVisibleBorder() : void {
        let type = this.cell.scheme.getBorderType(this.cell.schemePosition);
        if (null !== type) {
            let textureName = type ? 'border' : 'borderCorner';

            if (!this.content) {
                this.content = new SpriteModel(TT[textureName]);
                this.cell.model.addChild(this.content.model);
                this.lastTextureName = textureName;
            }
            if (textureName != this.lastTextureName) {
                this.content.changeTexture(TT[textureName]);
                this.lastTextureName = textureName;
            }
        }
        else if (this.content) {
            this.content.destroy();
            this.content = null;
        }
    }
}