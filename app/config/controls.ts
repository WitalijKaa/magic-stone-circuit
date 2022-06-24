import * as CONF from "./game";
import {Scheme} from "../Core/Scheme";
import {SchemeStorage} from "../Core/SchemeStorage";
import {DEFAULT_SCHEME_NAME, RESET_SCHEME_NAME} from "./game";
import {LEVELS} from "./levels";

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
    'x': CONF.ST_EMPTY,
    'X': CONF.ST_EMPTY,
    'й': CONF.ST_EMPTY,
    'Й': CONF.ST_EMPTY,
    'ч': CONF.ST_EMPTY,
    'Ч': CONF.ST_EMPTY,
    'p': CONF.ST_STONE_VIOLET,
    'P': CONF.ST_STONE_VIOLET,
    'o': CONF.ST_STONE_INDIGO,
    'O': CONF.ST_STONE_INDIGO,
}

export const CONTROL_EVENTS_KEYS = {
    'r': 'changeBuildRoadWayFixed',
    'R': 'changeBuildRoadWayFixed',
    'к': 'changeBuildRoadWayFixed',
    'К': 'changeBuildRoadWayFixed',
    'm': 'devCellEcho',
    'ь': 'devCellEcho',
    '=': 'speedUp',
    '+': 'speedUp',
    '-': 'speedDown',
    '_': 'speedDown',
    'p': 'setVioletSwitcher',
    'P': 'setVioletSwitcher',
    'o': 'setIndigoSwitcher',
    'O': 'setIndigoSwitcher',
    'l': 'putSmile',
    'a': 'checkLevel',
}

export const SWITCH_TO_OTHER_SCHEME = ['d', 'D', 'в', 'В'];

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

export function openModal(scheme: Scheme, schemeStorage: SchemeStorage) : void {
    document.getElementById('modal-wrapper')!.classList.remove('el--hidden');

    let menuHtml = '';
    schemeStorage.getSchemesNames().map((name: string) => {
        menuHtml += '<span>' + name + '</span>';
    })
    document.getElementById('saved-schemes')!.innerHTML = menuHtml;
    // @ts-ignore
    for (let $elSpan of document.querySelectorAll('#saved-schemes span')) {
        $elSpan.addEventListener('click', () => {
            document.getElementById('modal-wrapper')!.classList.add('el--hidden');
            loadScheme(scheme, schemeStorage, $elSpan.innerText);
        })
    }
}

export function loadScheme(scheme: Scheme, schemeStorage: SchemeStorage, name: string | null = null) {
    if (!name || "NEW SCHEME" == name) { name = prompt('name of Scheme...'); }
    if (!name || "NEW SCHEME" == name) { return; }

    let freshScheme = scheme.resetScheme();

    if (RESET_SCHEME_NAME == name.toLowerCase()) {
        scheme.setSaveToStorageMethod(schemeStorage.saveCallback());
        schemeStorage.resetScheme();
        schemeStorage.save();
        scheme.loadScheme(schemeStorage.load(freshScheme));
        name = DEFAULT_SCHEME_NAME;
    }
    else {
        scheme.setSaveToStorageMethod(schemeStorage.save.bind(schemeStorage, name));
        scheme.loadScheme(schemeStorage.load(freshScheme, name));
    }

    let $name = document.getElementById('scheme-name');
    if ($name) { $name.innerText = name; }
}

export function loadLevel(scheme: Scheme, levelCode: string) {
    let level = LEVELS[levelCode];

    scheme.levelMode(levelCode);

    let $name = document.getElementById('scheme-name');
    if ($name) { $name.innerText = level.name; }
}