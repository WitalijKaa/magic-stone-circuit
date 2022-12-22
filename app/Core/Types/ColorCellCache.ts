import {DirSide} from "./DirectionSide";

export type ColorCellCacheType = 'permanent' | 'extra';

export type ColorCellCache = {
    type: ColorCellCacheType;
    method: string;
    params: Array<any>;
    readonly cacheDirections: Array<DirSide>;
}
