import {IPoss} from "../IPoss";
import {DirSide} from "./DirectionSide";

export type CellPath = boolean | {
    color: number;
    from: DirSide;
}

export type CellRoad = {
    type: CellRoadType;
    paths: Array<CellPath>;
    checkRun: number | null;
}

export type CellRoadType = 1 | 2 | 3 | 4;
export type CellRoadPathType = 0 | 1 | 2 | 3 | 4;

export type RoadChangeHistory = {
    prev: null | CellRoadType;
    prevPaths?: Array<CellPath>;
    curr: null | CellRoadType;
    currPaths?: Array<CellPath>;
}

export type RoadChangeHistoryCell = {
    change: RoadChangeHistory;
    position: IPoss;
}