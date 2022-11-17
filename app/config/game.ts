import {DirSide} from "../Core/Types/DirectionSide";

export const DEFAULT_SCHEME_NAME = 'mainGrid';
export const RESET_SCHEME_NAME = 'reset';

export const START_TIMEOUT = 1000;
export const GRID_OFFSET = 2;

import {TT} from "./textures";

export const NANO_MS = 5;

export const PIXI_MOUSE_RIGHT = 2;

export const PIXI_ROTATE_UP = 0;
export const PIXI_ROTATE_RIGHT = 90;
export const PIXI_ROTATE_LEFT = 270;
export const PIXI_ROTATE_DOWN = 180;

export const COLOR_VIOLET_ROAD = 0x7e57c2;
export const COLOR_RED_ROAD = 0xe53935;
export const COLOR_INDIGO_ROAD = 0x3949ab;
export const COLOR_ORANGE_ROAD = 0xffa726;
export const COLOR_DARK_SMILE = 0x37474f;
export const COLOR_IX_STR = {
    [COLOR_VIOLET_ROAD]: 'V',
    [COLOR_RED_ROAD]: 'R',
    [COLOR_INDIGO_ROAD]: 'I',
    [COLOR_ORANGE_ROAD]: 'O',
}

export const UP = 'Up';
export const RIGHT = 'Right';
export const DOWN = 'Down';
export const LEFT = 'Left';
export const SIDES = [UP, RIGHT, DOWN, LEFT] as Array<DirSide>;
export const SIDES_DIAGONAL = ['UpLeft', 'UpRight', 'DownLeft', 'DownRight'];
export const SIDES_LEFT_RIGHT = [RIGHT, LEFT] as Array<DirSide>;
export const SIDES_UP_DOWN = [UP, DOWN] as Array<DirSide>;
export const SIDES_TURN_90 = {
    [UP]: SIDES_LEFT_RIGHT,
    [DOWN]: SIDES_LEFT_RIGHT,
    [LEFT]: SIDES_UP_DOWN,
    [RIGHT]: SIDES_UP_DOWN,
} as const;
export const SIDES_TURN_BY_CLOCK = {
    [UP]: RIGHT,
    [DOWN]: LEFT,
    [LEFT]: UP,
    [RIGHT]: DOWN,
} as const;
export const OPPOSITE_SIDE = {
    [UP]: DOWN,
    [DOWN]: UP,
    [LEFT]: RIGHT,
    [RIGHT]: LEFT,
} as const;
export const OVER_CENTER = 'Center';

export const ROTATE_FOR_ORIGINAL_RIGHT = { // if original sprite is rotated to right
    [UP]: PIXI_ROTATE_LEFT,
    [DOWN]: PIXI_ROTATE_RIGHT,
    [LEFT]: PIXI_ROTATE_DOWN,
    [RIGHT]: PIXI_ROTATE_UP,
} as const;

// SCENE

export const ST_STUB = 0;
export const ST_STONE_VIOLET = 1;
export const ST_STONE_RED = 2;
export const ST_STONE_INDIGO = 3;
export const ST_STONE_ORANGE = 4;

export const ST_TRIGGER = 5;
export const ST_ROAD = 6;
export const ST_ROAD_SLEEP = 7;
export const ST_ROAD_AWAKE = 8;
export const ST_SMILE = 9;
export const ST_SMILE_IN = 10;
export const ST_SPEED = 11;
export const ST_EMPTY = 'q';
export const ST_BORDER = 'b';

export const CONTENT_SPRITES = {
    [ST_STONE_VIOLET]: TT.stoneV,
    [ST_STONE_RED]: TT.stoneR,
    [ST_STONE_INDIGO]: TT.stoneI,
    [ST_STONE_ORANGE]: TT.stoneO,
};

export const TRIGGER_SPRITES = {
    [COLOR_VIOLET_ROAD]: TT.triggerV,
    [COLOR_RED_ROAD]: TT.triggerR,
    [COLOR_INDIGO_ROAD]: TT.triggerI,
    [COLOR_ORANGE_ROAD]: TT.triggerO,
};

export const STONE_TYPE_TO_ROAD_COLOR = {
    [ST_STONE_VIOLET]: COLOR_VIOLET_ROAD,
    [ST_STONE_RED]: COLOR_RED_ROAD,
    [ST_STONE_INDIGO]: COLOR_INDIGO_ROAD,
    [ST_STONE_ORANGE]: COLOR_ORANGE_ROAD,
} as const;

export const COLOR_TO_STONE_TYPE = {
    [COLOR_VIOLET_ROAD]: ST_STONE_VIOLET,
    [COLOR_RED_ROAD]: ST_STONE_RED,
    [COLOR_INDIGO_ROAD]: ST_STONE_INDIGO,
    [COLOR_ORANGE_ROAD]: ST_STONE_ORANGE,
} as const;

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
export const ROAD_COMMON_ROTATE = { [ROAD_LEFT_RIGHT]: 0, [ROAD_UP_DOWN]: PIXI_ROTATE_RIGHT, [ROAD_HEAVY]: 0, [ROAD_LIGHT]: 0 } as const;

export const ROAD_DEV = {
    [ROAD_LIGHT]: 'LIGHT',
    [ROAD_HEAVY]: 'HEAVY',
    [ROAD_LEFT_RIGHT]: 'LEFT_RIGHT',
    [ROAD_UP_DOWN]: 'UP_DOWN',
} as const;
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
} as const;

export const SIDE_TO_ROAD_PATH = {
    [UP]: ROAD_PATH_UP,
    [RIGHT]: ROAD_PATH_RIGHT,
    [DOWN]: ROAD_PATH_DOWN,
    [LEFT]: ROAD_PATH_LEFT,
} as const;
export const ROAD_PATH_TO_SIDE = {
    [ROAD_PATH_UP]: UP,
    [ROAD_PATH_RIGHT]: RIGHT,
    [ROAD_PATH_DOWN]: DOWN,
    [ROAD_PATH_LEFT]: LEFT,
} as const;
export const ALL_PATHS_EMPTY = [false, false, false, false, false] as const;
export const ALL_PATHS_ARE = [true, true, true, true, false] as const;

export const PATHS_IF_THREE_AROUND_COMBINATIONS = [
    [LEFT, RIGHT],
    [UP, DOWN],
    [UP, RIGHT],
    [RIGHT, DOWN],
    [DOWN, LEFT],
    [LEFT, UP],
] as Array<Array<DirSide>>;
export const PATHS_IF_FOUR_AROUND_COMBINATIONS = [
    [UP, RIGHT, DOWN],
    [RIGHT, DOWN, LEFT],
    [DOWN, LEFT, UP],
    [LEFT, UP, RIGHT],
] as Array<Array<DirSide>>;