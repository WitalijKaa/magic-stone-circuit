export type CellPath = boolean | {

}

export type CellRoad = {
    type: CellRoadType;
    paths: Array<CellPath>;
}

export type CellRoadType = 1 | 2 | 3 | 4;

export type RoadChangeHistory = {
    prev: null | number;
    prevPaths?: Array<boolean>;
    curr: null | number;
    currPaths?: Array<boolean>;
}