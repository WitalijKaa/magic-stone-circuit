import * as CONF from "./game";

export const CONTROL_KEYS = {
    '1': CONF.ST_STONE_VIOLET,
    '2': CONF.ST_STONE_RED,
    '3': CONF.ST_STONE_INDIGO,
    '4': CONF.ST_STONE_ORANGE,
    //'5': CONF.ST_ENERGY,
    '5': CONF.ST_ROAD,
    '6': CONF.ST_ROAD_SLEEP,
    '7': CONF.ST_ROAD_AWAKE,
    '8': 'q',
    'q': 'q',
    'Q': 'q',
}

export const CONTROL_EVENTS_KEYS = {
    'r': 'changeBuildRoadWayFixed',
    'R': 'changeBuildRoadWayFixed',
}

export function findButtonCode($imgBtnElem) {
    let code;
    for (let ix = 0; ix < $imgBtnElem.childNodes.length; ix++) {
        if ($imgBtnElem.childNodes[ix].dataset && $imgBtnElem.childNodes[ix].dataset.tip) {
            code = $imgBtnElem.childNodes[ix].dataset.tip;
            break;
        }
    }
    return code;
}
