import {ContentColor} from "./ColorTypes";
import {DirSide} from "./DirectionSide";

export type CellSpeed = {
    to: DirSide,
    color: null | ContentColor,
};

export type CellSpeedCopy = { t: DirSide };