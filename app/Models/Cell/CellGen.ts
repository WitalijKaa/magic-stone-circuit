import * as CONF from "../../config/game";
import {TT} from "../../config/textures";
import {CellGen as GenType} from "../../Core/Types/CellGen";
import {SubCellAbstractSingleColored} from "./SubCellAbstractSingleColored";
import {ICellWithGen} from "../../Core/Interfaces/ICellWithGen";

const TEXTURES_COLORED = {
    [CONF.COLOR_VIOLET_ROAD]: TT.genV,
    [CONF.COLOR_RED_ROAD]: TT.genR,
    [CONF.COLOR_INDIGO_ROAD]: TT.genI,
    [CONF.COLOR_ORANGE_ROAD]: TT.genO,
};

export class CellGen extends SubCellAbstractSingleColored {

    protected ghost: null | ICellWithGen = null;

    public get schemeCode() : string { return 'gen'; }

    get exists() : boolean {
        return !!(this.ghost || this.cell.schemeCell?.gen);
    }

    get textureName() : string {
        if (this.ghost) { return TT.ghostGen; }
        let color = this.schemeCell?.current;
        if (color) { return TEXTURES_COLORED[color]; }
        return TT.gen;
    }

    private get schemeCell() : null | GenType {
        if (!this.ghost) { return this.cell.schemeCell ? this.cell.schemeCell.gen : null; }
        return this.ghost.gen;
    }

    public killGhost() : void { this.cell.changeTexture(this.cell.defaultTexture); }
}