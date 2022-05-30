import {Cell} from "./Cell";
import {SchemeBase} from "./SchemeBase";
import * as CONF from "../config/pixi";

export class CellScheme {

    cellPosition: Cell;
    scheme: SchemeBase;

    content: CONF.ST_STONES | null = null;

    constructor(x: number, y: number, scheme: SchemeBase) {
        this.cellPosition = new Cell(x, y);
        this.scheme = scheme;
    }

    get stone() : CONF.ST_STONES | null {
        if (this.content && CONF.STONES.includes(this.content)) {
            return this.content;
        }
        return null;
    }

    get x() : number { return this.cellPosition.x; }
    get y() : number { return this.cellPosition.y; }

    get up() : CellScheme | null { return this.scheme.findCell(this.cellPosition.up); }
    get right() : CellScheme | null { return this.scheme.findCell(this.cellPosition.right); }
    get down() : CellScheme | null { return this.scheme.findCell(this.cellPosition.down); }
    get left() : CellScheme | null { return this.scheme.findCell(this.cellPosition.left); }
}