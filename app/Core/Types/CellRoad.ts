import {IPoss} from "../IPoss";
import {DirSide} from "./DirectionSide";

export type RoadPathsArray = [CellPath, CellPath, CellPath, CellPath, CellPath];
export type RoadSavePathsArray = [boolean, boolean, boolean, boolean, boolean];

export type CellPath = boolean | {
    color: number;
    from: DirSide;
}

export type CellRoad = {
    type: CellRoadType;
    paths: RoadPathsArray;
    checkRun: number;
}

export type CellRoadType = 1 | 2 | 3 | 4;
export type CellRoadPathType = 0 | 1 | 2 | 3 | 4;

export type RoadChangeHistory = {
    prev: null | CellRoadType;
    prevPaths?: RoadSavePathsArray;
    curr: null | CellRoadType;
    currPaths?: RoadSavePathsArray;
}

export type RoadChangeHistoryCell = {
    change: RoadChangeHistory;
    position: IPoss;
}