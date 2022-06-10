import {DirSide} from "./DirectionSide";

export type ColorCellCache = {
    type: number;
    method: string;
    params: Array<any>;
    readonly cacheDirections: Array<DirSide>;
}
