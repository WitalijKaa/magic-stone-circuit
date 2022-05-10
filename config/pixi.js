const NANO_MS = 2;

const PIXI_MOUSE_RIGHT = 2;

const PIXI_ROTATE_RIGHT = 6;
const PIXI_ROTATE_LEFT = 2;
const PIXI_ROTATE_DOWN = 8;
const PIXI_ROTATE_90 = 6;
const PIXI_ROTATE_270 = 2;
const PIXI_ROTATE_180 = 8;

const COLOR_VIOLET_ROAD = 0x7e57c2;
const COLOR_RED_ROAD = 0xe53935;
const COLOR_INDIGO_ROAD = 0x3949ab;
const COLOR_ORANGE_ROAD = 0xffa726;
const COLOR_VIOLET_ROAD_LIGHT = 0xb39ddb;
const COLOR_RED_ROAD_LIGHT = 0xe57373;
const COLOR_INDIGO_ROAD_LIGHT = 0x5c6bc0;
const COLOR_ORANGE_ROAD_LIGHT = 0xffcc80;

const UP = 'Up';
const RIGHT = 'Right';
const DOWN = 'Down';
const LEFT = 'Left';
const SIDES = [UP, RIGHT, DOWN, LEFT];
const SIDES_LEFT_RIGHT = [RIGHT, LEFT];
const SIDES_UP_DOWN = [UP, DOWN];
const SIDES_TURN_90 = {
    [UP]: SIDES_LEFT_RIGHT,
    [DOWN]: SIDES_LEFT_RIGHT,
    [LEFT]: SIDES_UP_DOWN,
    [RIGHT]: SIDES_UP_DOWN,
};
const OPPOSITE_SIDE = {
    [UP]: DOWN,
    [DOWN]: UP,
    [LEFT]: RIGHT,
    [RIGHT]: LEFT,
};
const OVER_CENTER = 'Center';
