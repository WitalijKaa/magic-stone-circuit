import * as CONF from "./game";

const BUTTON_DELETE = 'x';
const BUTTON_SPEED_UP = 'p';
const BUTTON_SPEED_DOWN = 'm';
const BUTTON_DISK = 'd';
const BUTTON_LEVEL_CHECK = 'l';

export const LEVELS = {

    l1: {
        name: 'Level 0010 Any color will fit',
        buttons: [BUTTON_LEVEL_CHECK, CONF.ST_ROAD, CONF.ST_STONE_VIOLET, CONF.ST_STONE_RED, CONF.ST_STONE_INDIGO, CONF.ST_STONE_ORANGE, BUTTON_DELETE, BUTTON_DISK],
        json: '{"103":{"111":{"c":{"t":4}},"112":{"r":{"t":1,"p":"01"}}},"104":{"112":{"r":{"t":3,"p":"13"}}},"105":{"111":{"c":{"t":4}},"112":{"r":{"t":2,"p":"0134"}}},"106":{"104":{"c":{"t":1}},"112":{"r":{"t":3,"p":"13"}}},"107":{"104":{"r":{"t":3,"p":"13"}},"107":{"c":{"t":2}},"109":{"c":{"t":3}},"112":{"r":{"t":3,"p":"13"}}},"108":{"104":{"r":{"t":3,"p":"13"}},"112":{"r":{"t":3,"p":"13"}}},"109":{"104":{"r":{"t":3,"p":"13"}},"112":{"r":{"t":1,"p":"23"}},"113":{"r":{"t":2,"p":"0124"}},"114":{"r":{"t":4,"p":"02"}}},"110":{"101":{"r":{"t":4,"p":"02"}},"102":{"r":{"t":4,"p":"02"}},"103":{"r":{"t":4,"p":"02"}},"104":{"r":{"t":1,"p":"03"}},"113":{"r":{"t":3,"p":"13"}}},"111":{"113":{"r":{"t":3,"p":"13"}}},"113":{"104":{"r":{"t":4,"p":"02"}},"105":{"r":{"t":1,"p":"01"}}},"114":{"105":{"r":{"t":3,"p":"13"}}},"115":{"103":{"r":{"t":1,"p":"12"}},"104":{"r":{"t":4,"p":"02"}},"105":{"r":{"t":1,"p":"03"}}},"116":{"103":{"r":{"t":3,"p":"13"}}},"122":{},"123":{"109":{"i":{"l":"True"}}}}'
    },

    l2: {
        name: 'Level 0020 Violet color only',
        buttons: [BUTTON_LEVEL_CHECK, CONF.ST_ROAD, CONF.ST_STONE_VIOLET, CONF.ST_STONE_RED, CONF.ST_STONE_INDIGO, CONF.ST_STONE_ORANGE, BUTTON_DELETE, BUTTON_DISK],
        json: '{"123":{"109":{"i":{"l":"Violet"}}}}'
    },

    l3: {
        name: 'Level 0030 Find they colors',
        buttons: [BUTTON_LEVEL_CHECK, CONF.ST_ROAD, CONF.ST_STONE_VIOLET, CONF.ST_STONE_RED, CONF.ST_STONE_INDIGO, CONF.ST_STONE_ORANGE, BUTTON_DELETE, BUTTON_DISK],
        json: '{"105":{"104":{"c":{"t":3}},"108":{"c":{"t":2}}},"106":{"104":{"r":{"t":3,"p":"13"}},"108":{"r":{"t":3,"p":"13"}}},"107":{"104":{"r":{"t":3,"p":"13"}},"108":{"r":{"t":3,"p":"13"}}},"108":{"102":{"r":{"t":4,"p":"02"}},"103":{"r":{"t":4,"p":"02"}},"104":{"r":{"t":2,"p":"0134"}}},"109":{"104":{"r":{"t":1,"p":"23"}},"105":{"r":{"t":4,"p":"02"}}},"122":{},"123":{"109":{"i":{"l":"Violet"}}},"124":{"105":{"i":{"l":"Red"}},"113":{"i":{"l":"Indigo"}}},"126":{},"127":{"114":{"i":{"l":"Orange"}}}}'
    },

    l4: {
        name: 'Level 0040 Violet on Violet, silence on Red',
        buttons: [BUTTON_LEVEL_CHECK, CONF.ST_ROAD_AWAKE, CONF.ST_ROAD_SLEEP, CONF.ST_ROAD, CONF.ST_STONE_VIOLET, CONF.ST_STONE_RED, CONF.ST_STONE_INDIGO, CONF.ST_STONE_ORANGE, BUTTON_DELETE, BUTTON_DISK],
        json: '{"112":{"109":{"c":{"t":1,"r":[1,2]}}},"116":{"109":{"s":{"t":7,"d":3}}},"117":{"109":{"s":{"t":8,"d":2}},"110":{"r":{"t":1,"p":"02"}}},"118":{"109":{"s":{"t":7,"d":3}}},"122":{},"123":{"109":{"i":{"l":"SwitcherTrue"}}}}'
    },

    l5: {
        name: 'Level 0050 Say NOT: Violet on Red, Red on Violet',
        buttons: [BUTTON_LEVEL_CHECK, CONF.ST_ROAD_AWAKE, CONF.ST_ROAD_SLEEP, CONF.ST_ROAD, CONF.ST_STONE_VIOLET, CONF.ST_STONE_RED, CONF.ST_STONE_INDIGO, CONF.ST_STONE_ORANGE, BUTTON_DELETE, BUTTON_DISK],
        json: '{"112":{"109":{"c":{"t":1,"r":[1,2]}}},"114":{"105":{"c":{"t":1}},"113":{"c":{"t":2}}},"115":{"105":{"r":{"t":3,"p":"13"}},"113":{"r":{"t":3,"p":"13"}}},"116":{"105":{"r":{"t":3,"p":"13"}},"113":{"r":{"t":3,"p":"13"}}},"117":{"105":{"r":{"t":1,"p":"23"}},"106":{"s":{"t":7,"d":4}},"107":{"s":{"t":8,"d":2}},"111":{"s":{"t":8,"d":2}},"112":{"s":{"t":7,"d":4}},"113":{"r":{"t":1,"p":"03"}}},"120":{"109":{"r":{"t":3,"p":"13"}}},"121":{"109":{"r":{"t":3,"p":"13"}}},"122":{},"123":{"109":{"i":{"l":"SwitcherOpposite"}}}}'
    },

}