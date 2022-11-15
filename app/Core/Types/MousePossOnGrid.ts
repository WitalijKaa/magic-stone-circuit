import {Poss} from "../Poss";
import {GridZone} from "./GridCursor";

export type MousePossOnGrid = {
    pxGlobal: Poss,
    localGrid: Poss,
    globalGrid: Poss,
    localCellPx: Poss,
    zone?: GridZone,
}