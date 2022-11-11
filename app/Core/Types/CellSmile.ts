import {SemiColorCallback} from "./CellSemiconductor";
import {ContentColor} from "./ColorTypes";

export type CellSmile = {
    type: 9 | 10,
    color: ContentColor,
    view: boolean,
    logic: string,
    event?: null | SemiColorCallback,
}

export type CellSmileCopy = {
    l: string,
}