export const START_TIMEOUT = 1000;
export const GRID_OFFSET = 2;

import {TT} from "./textures";

export const NANO_MS = 2;

export const PIXI_MOUSE_RIGHT = 2;

export const PIXI_ROTATE_UP = 0;
export const PIXI_ROTATE_RIGHT = 90;
export const PIXI_ROTATE_LEFT = 270;
export const PIXI_ROTATE_DOWN = 180;

export const COLOR_VIOLET_ROAD = 0x7e57c2;
export const COLOR_RED_ROAD = 0xe53935;
export const COLOR_INDIGO_ROAD = 0x3949ab;
export const COLOR_ORANGE_ROAD = 0xffa726;
export const COLOR_VIOLET_ROAD_LIGHT = 0xb39ddb;
export const COLOR_RED_ROAD_LIGHT = 0xe57373;
export const COLOR_INDIGO_ROAD_LIGHT = 0x5c6bc0;
export const COLOR_ORANGE_ROAD_LIGHT = 0xffcc80;

export const UP = 'Up';
export const RIGHT = 'Right';
export const DOWN = 'Down';
export const LEFT = 'Left';
export const SIDES = [UP, RIGHT, DOWN, LEFT];
export const SIDES_LEFT_RIGHT = [RIGHT, LEFT];
export const SIDES_UP_DOWN = [UP, DOWN];
export const SIDES_TURN_90 = {
    [UP]: SIDES_LEFT_RIGHT,
    [DOWN]: SIDES_LEFT_RIGHT,
    [LEFT]: SIDES_UP_DOWN,
    [RIGHT]: SIDES_UP_DOWN,
};
export const OPPOSITE_SIDE = {
    [UP]: DOWN,
    [DOWN]: UP,
    [LEFT]: RIGHT,
    [RIGHT]: LEFT,
};
export const OVER_CENTER = 'Center';

// SCENE

export const ST_STONE_VIOLET = 1;
export const ST_STONE_RED = 2;
export const ST_STONE_INDIGO = 3;
export const ST_STONE_ORANGE = 4;

export const ST_ENERGY = 5;
export const ST_ROAD = 6;
export const ST_ROAD_SLEEP = 7;
export const ST_ROAD_AWAKE = 8;
export const ST_EMPTY = 'q';

export const CONTENT_SPRITES = {
    [ST_STONE_VIOLET]: TT.stoneV,
    [ST_STONE_RED]: TT.stoneR,
    [ST_STONE_INDIGO]: TT.stoneI,
    [ST_STONE_ORANGE]: TT.stoneO,
    //[ST_ENERGY]: TT.energy,
}
export const SEMICONDUCTOR_SPRITES = {
    [ST_ROAD_SLEEP]: TT.roadSleep,
    [ST_ROAD_AWAKE]: TT.roadAwakening,
}
export const SEMICONDUCTOR_SPRITES_CHARGE = {
    [ST_ROAD_SLEEP]: TT.roadSleepCharge,
    [ST_ROAD_AWAKE]: TT.roadAwakeningCharge,
}
export const SEMICONDUCTOR_SPRITES_FLOW = {
    [ST_ROAD_SLEEP]: TT.roadSleepFlow,
    [ST_ROAD_AWAKE]: TT.roadAwakeningFlow,
}

export const STONE_TYPE_TO_ROAD_COLOR = {
    [ST_STONE_VIOLET]: COLOR_VIOLET_ROAD,
    [ST_STONE_RED]: COLOR_RED_ROAD,
    [ST_STONE_INDIGO]: COLOR_INDIGO_ROAD,
    [ST_STONE_ORANGE]: COLOR_ORANGE_ROAD,
}

export const ROAD_TO_LIGHT_COLOR = {
    [COLOR_VIOLET_ROAD]: COLOR_VIOLET_ROAD_LIGHT,
    [COLOR_RED_ROAD]: COLOR_RED_ROAD_LIGHT,
    [COLOR_INDIGO_ROAD]: COLOR_INDIGO_ROAD_LIGHT,
    [COLOR_ORANGE_ROAD]: COLOR_ORANGE_ROAD_LIGHT,
}

// type BuildRoadWays
export const BUILD_ROAD_WAY_HORZ_VERT = 1;
export const BUILD_ROAD_WAY_VERT_HORZ = 2;
export const BUILD_ROAD_WAY_STEPS_HORZ_VERT = 3;
export const BUILD_ROAD_WAY_STEPS_VERT_HORZ = 4;

// ROAD

export const ROAD_LIGHT = 1;
export const ROAD_HEAVY = 2;
export const ROAD_LEFT_RIGHT = 3;
export const ROAD_UP_DOWN = 4;
export const ROAD_COMMON_ROTATE = { [ROAD_LEFT_RIGHT]: null, [ROAD_UP_DOWN]: PIXI_ROTATE_RIGHT, [ROAD_HEAVY]: null, [ROAD_LIGHT]: null };

export const ROAD_DEV = {
    [ROAD_LIGHT]: 'LIGHT',
    [ROAD_HEAVY]: 'HEAVY',
    [ROAD_LEFT_RIGHT]: 'LEFT_RIGHT',
    [ROAD_UP_DOWN]: 'UP_DOWN',
}
export const ROAD_PATH_UP = 0;
export const ROAD_PATH_RIGHT = 1;
export const ROAD_PATH_DOWN = 2;
export const ROAD_PATH_LEFT = 3;
export const ROAD_PATH_HEAVY = 4;

export const ROAD_DEV_PATH = {
    [ROAD_PATH_UP]: 'UP',
    [ROAD_PATH_RIGHT]: 'RIGHT',
    [ROAD_PATH_DOWN]: 'DOWN',
    [ROAD_PATH_LEFT]: 'LEFT',
    [ROAD_PATH_HEAVY]: 'CENTER-heavy',
}

export const SIDE_TO_ROAD_PATH = {
    [UP]: ROAD_PATH_UP,
    [RIGHT]: ROAD_PATH_RIGHT,
    [DOWN]: ROAD_PATH_DOWN,
    [LEFT]: ROAD_PATH_LEFT,
};
export const ROAD_PATH_TO_SIDE = {
    [ROAD_PATH_UP]: UP,
    [ROAD_PATH_RIGHT]: RIGHT,
    [ROAD_PATH_DOWN]: DOWN,
    [ROAD_PATH_LEFT]: LEFT,
};
export const ALL_PATHS_EMPTY = [false, false, false, false, false];
export const ALL_PATHS_ARE = [true, true, true, true, false];
