export const NANO_MS = 2;

export const PIXI_MOUSE_RIGHT = 2;

export const PIXI_ROTATE_RIGHT = 6;
export const PIXI_ROTATE_LEFT = 2;
export const PIXI_ROTATE_DOWN = 8;
export const PIXI_ROTATE_90 = 6;
export const PIXI_ROTATE_270 = 2;
export const PIXI_ROTATE_180 = 8;

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
