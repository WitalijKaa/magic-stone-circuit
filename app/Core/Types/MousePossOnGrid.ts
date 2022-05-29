import {Poss} from "../Poss";
import {GridZone} from "./GridCursor";

export type MousePossOnGrid = {
    localGrid: Poss,
    globalGrid: Poss,
    localCellPx: Poss,
    zone?: GridZone,
}