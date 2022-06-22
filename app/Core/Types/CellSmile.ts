import {SemiColor} from "./CellSemiconductor";

export type CellSmile = {
    type: 9 | 10,
    color: SemiColor,
    view: boolean,
    logic: string,
}

export type CellSmileCopy = {
    t: 9 | 10,
    v: number,
    l: string,
}