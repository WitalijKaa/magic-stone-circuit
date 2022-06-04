import {IPoss} from "../IPoss";

export type CellPath = boolean | {

}

export type CellRoad = {
    type: CellRoadType;
    paths: Array<CellPath>;
}

export type CellRoadType = 1 | 2 | 3 | 4;

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