import {SemiColor} from "./CellSemiconductor";

export type CellSmile = {
    type: 9 | 10,
    color: SemiColor,
    view: boolean,
    logic: string,
    event?: Promise<SemiColor>,
}

export type CellSmileCopy = {
    l: string,
}