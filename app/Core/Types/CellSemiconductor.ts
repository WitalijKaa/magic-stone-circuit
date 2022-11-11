import {DirSide} from "./DirectionSide";
import {ContentColor} from "./ColorTypes";

export type CellSemiconductorType = 7 | 8; // ST_ROAD_SLEEP ST_ROAD_AWAKE
export type CellSemiconductorDirection = 2 | 3 | 4; // ROAD_HEAVY ROAD_LEFT_RIGHT ROAD_UP_DOWN
export type SemiColorCallback = (color: ContentColor) => void;

export type CellSemiconductor = {
    from: DirSide | null,
    colorAwake: ContentColor,
    colorFlow: ContentColor,
    colorCharge: ContentColor,
    direction: CellSemiconductorDirection,
    type: CellSemiconductorType,
    checkRun: number;
}