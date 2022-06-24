import {DirSide} from "./DirectionSide";

export type CellSemiconductorType = 7 | 8; // ST_ROAD_SLEEP ST_ROAD_AWAKE
export type CellSemiconductorDirection = 2 | 3 | 4; // ROAD_HEAVY ROAD_LEFT_RIGHT ROAD_UP_DOWN
export type SemiColor = number | null;
export type SemiColorCallback = (color: SemiColor) => void;

export type CellSemiconductor = {
    from: DirSide | null,
    colorAwake: SemiColor,
    colorFlow: SemiColor,
    colorCharge: SemiColor,
    direction: CellSemiconductorDirection,
    type: CellSemiconductorType,
    checkRun: number;
}