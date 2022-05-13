const CONTROL_KEYS = {
    '1': ST_STONE_VIOLET,
    '2': ST_STONE_RED,
    '3': ST_STONE_INDIGO,
    '4': ST_STONE_ORANGE,
    //'5': ST_ENERGY,
    '5': ST_ROAD,
    '6': ST_ROAD_SLEEP,
    '7': ST_ROAD_AWAKE,
    '8': 'q',
    'q': 'q',
    'Q': 'q',
}

const CONTROL_EVENTS_KEYS = {
    'r': 'changeBuildRoadWayFixed',
    'R': 'changeBuildRoadWayFixed',
}

function findButtonCode($imgBtnElem) {
    let code;
    for (let ix = 0; ix < $imgBtnElem.childNodes.length; ix++) {
        $imgBtnElem.childNodes[ix].className
        if ($imgBtnElem.childNodes[ix].className == "img-btn__tip") {
            code = $imgBtnElem.childNodes[ix].innerText;
            break;
        }
    }
    return code;
}
