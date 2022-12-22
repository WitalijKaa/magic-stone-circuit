import {CellGrid} from "./CellGrid";
import {CellGhost} from "./CellGhost";
import {ICellScheme} from "../../Core/Interfaces/ICellScheme";

export abstract class SubCellAbstractSingleColored {

    constructor(protected cell: CellGrid | CellGhost) { }

    protected ghost: null | ICellScheme = null;
    private lastTextureName: string = '';

    public abstract get schemeCode() : string;

    public update() : void {
        if (this.exists) {
            if (!this.lastTextureName || this.lastTextureName != this.textureName) {
                let textureName = this.textureName;
                this.cell.changeTexture(textureName);
                this.lastTextureName = textureName;
            }
        }
        else if (this.lastTextureName) {
            this.cell.changeTexture(this.cell.defaultTexture);
            this.lastTextureName = '';
        }
    }

    public abstract get exists() : boolean;
    public abstract get textureName() : string;

    public set asGhost(cell: ICellScheme) { this.ghost = cell; }

    public killGhost() : void { this.cell.changeTexture(this.cell.defaultTexture); }

}