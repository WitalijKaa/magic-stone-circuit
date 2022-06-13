import * as CONF from "./game";

export const CONTROL_KEYS = {
    '1': CONF.ST_STONE_VIOLET,
    '2': CONF.ST_STONE_RED,
    '3': CONF.ST_STONE_INDIGO,
    '4': CONF.ST_STONE_ORANGE,
    '5': CONF.ST_ROAD,
    '6': CONF.ST_ROAD_SLEEP,
    '7': CONF.ST_ROAD_AWAKE,
    '8': CONF.ST_EMPTY,
    'q': CONF.ST_EMPTY,
    'Q': CONF.ST_EMPTY,
}

export const CONTROL_EVENTS_KEYS = {
    'r': 'changeBuildRoadWayFixed',
    'R': 'changeBuildRoadWayFixed',
    'm': 'devCellEcho',
}

export function findButtonCode($imgBtnElem: HTMLElement) : string {
    let code;
    for (let ix = 0; ix < $imgBtnElem.childNodes.length; ix++) {
        // @ts-ignore
        if ($imgBtnElem.childNodes[ix].dataset && $imgBtnElem.childNodes[ix].dataset.tip) {
            // @ts-ignore
            code = $imgBtnElem.childNodes[ix].dataset.tip;
            break;
        }
    }
    return code;
}

export function viewControlPen(pen: string) : void {
    let $el = document.querySelector('[data-tip="' + pen + '"]') as HTMLMediaElement;
    let $btn = document.getElementById('current-btn');
    if ($el && $btn) {
        $btn.style.backgroundImage = "url('" + $el.currentSrc + "')";
    }
}