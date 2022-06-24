import {SemiColor, SemiColorCallback} from "./CellSemiconductor";

export type CellSmile = {
    type: 9 | 10,
    color: SemiColor,
    view: boolean,
    logic: string,
    event?: null | SemiColorCallback,
}

export type CellSmileCopy = {
    l: string,
}