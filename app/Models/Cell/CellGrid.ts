import {Cell} from "../../Core/Cell";
import {SchemeGrid} from "../Scheme/SchemeGrid";
import {CellAbstract} from "./CellAbstract";
import {TT} from "../../config/textures";
import {SpriteModel} from "../SpriteModel";

export class CellGrid extends CellAbstract {

    constructor(position: Cell, grid: SchemeGrid) {
        super(position, grid, SpriteModel.from(TT.cell));
    }
}