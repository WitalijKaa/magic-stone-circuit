import * as CONF from "./game";
import {Scheme} from "../Core/Scheme";
import {SchemeStorage} from "../Core/SchemeStorage";
import {DEFAULT_SCHEME_NAME, RESET_SCHEME_NAME} from "./game";
import {LEVELS} from "./levels";
import {SchemeGrid} from "../Models/Scheme/SchemeGrid";

export const CONTROL_KEYS = {
    '1': CONF.ST_STONE_VIOLET,
    '2': CONF.ST_STONE_RED,
    '3': CONF.ST_STONE_INDIGO,
    '4': CONF.ST_STONE_ORANGE,
    '5': CONF.ST_ROAD_SLEEP,
    '6': CONF.ST_ROAD_AWAKE,
    '7': CONF.ST_TRIGGER,
    '8': CONF.ST_SPEED,
    '9': CONF.ST_BORDER,
    '`': CONF.ST_ROAD,
    '~': CONF.ST_ROAD,
    'ё': CONF.ST_ROAD,
    'Ё': CONF.ST_ROAD,
    'q': CONF.ST_EMPTY,
    'Q': CONF.ST_EMPTY,
    'й': CONF.ST_EMPTY,
    'Й': CONF.ST_EMPTY,
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
    // 'p': 'setVioletSwitcher',
    // 'P': 'setVioletSwitcher',
    // 'o': 'setIndigoSwitcher',
    // 'O': 'setIndigoSwitcher',
    // 'l': 'putSmile',
    'a': 'checkLevel',
    'A': 'checkLevel',
    'ф': 'checkLevel',
    'Ф': 'checkLevel',
    'c': 'setVisualCenter',
    'C': 'setVisualCenter',
    'с': 'setVisualCenter',
    'С': 'setVisualCenter',
    'x': 'scaleIncrease',
    'X': 'scaleIncrease',
    'ч': 'scaleIncrease',
    'Ч': 'scaleIncrease',
    'z': 'scaleDecrease',
    'Z': 'scaleDecrease',
    'я': 'scaleDecrease',
    'Я': 'scaleDecrease',
}

export const OPEN_MODAL_MENU = ['d', 'D', 'в', 'В'];
export const OPEN_MODAL_PATTERNS_MENU = ['p', 'P', 'з', 'З'];

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
            for (let $btn of document.getElementsByClassName('img-btn') as unknown as Array<HTMLElement>) {
                $btn.classList.remove('el--hidden')
            }
            document.getElementById('btn-levels')!.classList.add('el--hidden');
            document.getElementById('modal-wrapper')!.classList.add('el--hidden');
            loadScheme(scheme, schemeStorage, $elSpan.innerText);
        })
    }
}

export function openPatternsModal(scheme: Scheme, schemeStorage: SchemeStorage) : void {
    document.getElementById('modal-pattern-wrapper')!.classList.remove('el--hidden');

    let menuHtml = '';
    schemeStorage.getPatternNames().map((name: string) => {
        menuHtml += '<span>' + name + '</span>';
    })
    document.getElementById('saved-patterns')!.innerHTML = menuHtml;
    // @ts-ignore
    for (let $elSpan of document.querySelectorAll('#saved-patterns span')) {
        $elSpan.addEventListener('click', () => {
            document.getElementById('modal-pattern-wrapper')!.classList.add('el--hidden');
            scheme.loadPattern(schemeStorage.loadPattern($elSpan.innerText));
        })
    }
}

export function loadScheme(scheme: Scheme, schemeStorage: SchemeStorage, name: string | null = null) : void {
    if (!name || "NEW SCHEME" == name) { name = prompt('name of Scheme...'); }
    if (!name || "NEW SCHEME" == name) { return; }

    let freshScheme = scheme.resetScheme();

    if (RESET_SCHEME_NAME == name.toLowerCase()) {
        scheme.setSaveToStorageMethod(schemeStorage.createSaveCallback());
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

export function addPenHandlers(scheme: Scheme, schemeStorage: SchemeStorage, schemeGrid: SchemeGrid) : void {

    /** KEY PRESS */

    document.addEventListener('keypress', (event) => {
        scheme.beforeAnyInput();
        if (CONTROL_KEYS.hasOwnProperty(event.key)) {
            schemeGrid.controlPen = CONTROL_KEYS[event.key];
            viewControlPen(schemeGrid.controlPen);
        }
        schemeGrid.controlEvent = event.key;
        if (OPEN_MODAL_MENU.includes(event.key)) { openModal(scheme, schemeStorage); }
        else if (OPEN_MODAL_PATTERNS_MENU.includes(event.key)) { openPatternsModal(scheme, schemeStorage); }
    });

    /** CLICK */

    let $buttons = document.getElementsByClassName('img-btn') as unknown as Array<HTMLElement>;
    for (let $btn of $buttons) {
        let $subscriber = $btn;
        $btn.addEventListener('click', () => {
            scheme.beforeAnyInput();
            let pen: any = +findButtonCode($subscriber) ? +findButtonCode($subscriber) : findButtonCode($subscriber);
            if (pen) {
                schemeGrid.controlPen = pen;
                viewControlPen(pen);
            }
            schemeGrid.controlEvent = pen;
            if (OPEN_MODAL_MENU.includes(pen)) { openModal(scheme, schemeStorage); }
            if (OPEN_MODAL_PATTERNS_MENU.includes(pen)) { openPatternsModal(scheme, schemeStorage); }
        })
    }

    /** MODALs */

    document.addEventListener('keydown', (event) => {
        if (event.key === "Escape" && !document.getElementById('modal-wrapper')!.classList.contains('el--hidden')) {
            document.getElementById('modal-wrapper')!.classList.add('el--hidden');
        }
        if (event.key === "Escape" && !document.getElementById('modal-pattern-wrapper')!.classList.contains('el--hidden')) {
            document.getElementById('modal-pattern-wrapper')!.classList.add('el--hidden');
        }
    });

    document.getElementById('modal-wrapper')!.addEventListener('click', () => {
        if(!document.getElementById('modal-wrapper')!.classList.contains('el--hidden')) {
            document.getElementById('modal-wrapper')!.classList.add('el--hidden');
        }
    });

    document.getElementById('modal-pattern-wrapper')!.addEventListener('click', () => {
        if(!document.getElementById('modal-pattern-wrapper')!.classList.contains('el--hidden')) {
            document.getElementById('modal-pattern-wrapper')!.classList.add('el--hidden');
        }
    });
}

export function createModal(scheme: Scheme, schemeStorage: SchemeStorage) : void {
    let menuHtml = '';
    menuHtml += '<span>RESET</span>';
    menuHtml += '<span>NEW SCHEME</span>';
    menuHtml += '<span>JUST FIND CENTER</span>';
    document.getElementById('menu-schemes')!.innerHTML = menuHtml;
    // @ts-ignore
    for (let $elSpan of document.querySelectorAll('#menu-schemes span')) {
        $elSpan.addEventListener('click', () => {
            for (let $btn of document.getElementsByClassName('img-btn') as unknown as Array<HTMLElement>) {
                $btn.classList.remove('el--hidden')
            }
            document.getElementById('btn-levels')!.classList.add('el--hidden');
            document.getElementById('modal-wrapper')!.classList.add('el--hidden');
            if ('JUST FIND CENTER' == $elSpan.innerText) {
                scheme.setVisualCenter();
            }
            else {
                loadScheme(scheme, schemeStorage, $elSpan.innerText);
            }
        })
    }

    menuHtml = '';
    for (let levelCode in LEVELS) {
        menuHtml += '<span data-code="' + levelCode + '">' + LEVELS[levelCode].name + '</span>';
    }
    document.getElementById('levels')!.innerHTML = menuHtml;
    // @ts-ignore
    for (let $elSpan of document.querySelectorAll('#levels span')) {
        $elSpan.addEventListener('click', function () {
            let level = LEVELS[this.dataset.code];
            for (let $btn of document.getElementsByClassName('img-btn') as unknown as Array<HTMLElement>) {
                $btn.classList.add('el--hidden')
            }
            level.buttons.map((btnNick) => {
                document.getElementById('b-' + btnNick)!.classList.remove('el--hidden')
            })

            document.getElementById('modal-wrapper')!.classList.add('el--hidden');
            loadLevel(scheme, this.dataset.code);
        })
    }
}