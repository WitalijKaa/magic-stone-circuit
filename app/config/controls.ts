import * as CONF from "./game";
import {Scheme} from "../Core/Scheme";
import {SchemeStorage} from "../Core/SchemeStorage";
import {DEFAULT_SCHEME_NAME, PEN_MAIN_MENU, PEN_PUT_PATTERN} from "./game";
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

export function viewControlPen(pen: string) : boolean {
    let $el = document.querySelector('[data-tip="' + pen + '"]:not([data-dont-show-as-selected])') as HTMLMediaElement;
    let $btn = document.getElementById('current-btn');
    if ($el && $btn) {
        $btn.style.backgroundImage = "url('" + $el.currentSrc + "')";
        return true;
    }
    return false;
}

export function openModal(scheme: Scheme, schemeStorage: SchemeStorage) : void {
    // @ts-ignore
    window.deleteModalMode = false;
    setPointerStyleAtMenuModal();
    document.getElementById('modal-wrapper')!.classList.remove('el--hidden');

    let menuHtml = '';
    schemeStorage.getSchemesNames().forEach((name: string) => {
        menuHtml += '<span>' + name + '</span>';
    })
    document.getElementById('saved-schemes')!.innerHTML = menuHtml;
    // @ts-ignore
    for (let $elSpan of document.querySelectorAll('#saved-schemes span')) {
        $elSpan.addEventListener('click', () => {
            clickScheme(scheme, schemeStorage, $elSpan.innerText);
        })
    }
}

export function openPatternsModal(scheme: Scheme, schemeStorage: SchemeStorage) : void {
    if (!schemeStorage.getPatternNames().length) {
        alert('Have no saved patterns... :(');
        return;
    }

    // @ts-ignore
    window.deleteModalMode = false;
    setPointerStyleAtPatternsModal();
    document.getElementById('modal-pattern-wrapper')!.classList.remove('el--hidden');

    let menuHtml = '';
    schemeStorage.getPatternNames().forEach((name: string) => {
        menuHtml += '<span>' + name + '</span>';
    })
    document.getElementById('saved-patterns')!.innerHTML = menuHtml;
    // @ts-ignore
    for (let $elSpan of document.querySelectorAll('#saved-patterns span')) {
        $elSpan.addEventListener('click', () => {
            // @ts-ignore
            if (!window.deleteModalMode) {
                scheme.loadPattern(schemeStorage.loadPattern($elSpan.innerText));
                document.getElementById('modal-pattern-wrapper')!.classList.add('el--hidden');
            }
            else if (schemeStorage.deletePattern($elSpan.innerText)) {
                $elSpan.remove();
                if (!document.querySelectorAll('#saved-patterns span').length) {
                    document.getElementById('modal-pattern-wrapper')!.classList.add('el--hidden');
                }
            }
        })
    }
}

function setPointerStyleAtMenuModal() {
    // @ts-ignore
    if (window.deleteModalMode && !document.getElementById('modal-wrapper')!.classList.contains('mode--delete')) {
        document.getElementById('modal-wrapper')!.classList.add('mode--delete');
    }
    // @ts-ignore
    else if (!window.deleteModalMode && document.getElementById('modal-wrapper')!.classList.contains('mode--delete')) {
        document.getElementById('modal-wrapper')!.classList.remove('mode--delete');
    }
};

function clickMenuSpecialFunction(scheme: Scheme, schemeStorage: SchemeStorage, name: string) : void {

    if ('DELETE SCHEME' == name) {
        // @ts-ignore
        window.deleteModalMode = !window.deleteModalMode;
        setPointerStyleAtMenuModal();
        return;
    }
    else {
        // @ts-ignore
        window.deleteModalMode = false;
        setPointerStyleAtMenuModal();
    }

    if ('NEW SCHEME' == name) {
        let newSchemeName = prompt('name of Scheme...');
        clickScheme(scheme, schemeStorage, newSchemeName);
    }

    if ('JUST FIND CENTER' == name) {
        scheme.setVisualCenter();
    }

    if ('RESET' == name) {
        let freshScheme = scheme.resetScheme();
        scheme.setSaveToStorageMethod(schemeStorage.createSaveCallback());
        schemeStorage.resetScheme();
        schemeStorage.save();
        scheme.loadScheme(schemeStorage.load(freshScheme));
        name = DEFAULT_SCHEME_NAME;
        let $name = document.getElementById('scheme-name');
        if ($name) { $name.innerText = name; }
    }
    closeModalMenu();
}

export function clickScheme(scheme: Scheme, schemeStorage: SchemeStorage, name: string | null = null) : void {
    if (!name || "NEW SCHEME" == name) { return; }

    // @ts-ignore
    if (window.deleteModalMode) {
        deleteScheme(schemeStorage, name)
        return;
    }

    let freshScheme = scheme.resetScheme();

    scheme.setSaveToStorageMethod(schemeStorage.save.bind(schemeStorage, name));
    scheme.loadScheme(schemeStorage.load(freshScheme, name));

    let $name = document.getElementById('scheme-name');
    if ($name) { $name.innerText = name; }
    closeModalMenu();
}

export function deleteScheme(schemeStorage: SchemeStorage, name: string) : void {
    schemeStorage.delete(name);

    // @ts-ignore
    for (let $elSpan of document.querySelectorAll('#saved-schemes span')) {
        if ($elSpan.textContent == name) {
            $elSpan.remove();
            break;
        }
    }
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
            if (pen && viewControlPen(pen)) {
                schemeGrid.controlPen = pen;
            }
            schemeGrid.controlEvent = pen;
            if (PEN_MAIN_MENU == pen || OPEN_MODAL_MENU.includes(pen)) { openModal(scheme, schemeStorage); }
            if (PEN_PUT_PATTERN == pen || OPEN_MODAL_PATTERNS_MENU.includes(pen)) { openPatternsModal(scheme, schemeStorage); schemeGrid.controlPen = pen; }
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
    menuHtml += '<span>DELETE SCHEME</span>';
    document.getElementById('menu-of-saved-schemes')!.innerHTML = menuHtml;
    // @ts-ignore
    for (let $elSpan of document.querySelectorAll('#menu-of-saved-schemes span')) {
        $elSpan.addEventListener('click', () => {
            clickMenuSpecialFunction(scheme, schemeStorage, $elSpan.innerText);
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
            level.buttons.forEach((btnID) => {
                if ('btn-' != btnID.toString().substr(0, 4)) {
                    btnID = 'btn-type-' + btnID;
                }
                document.getElementById(btnID)!.classList.remove('el--hidden')
            })

            document.getElementById('modal-wrapper')!.classList.add('el--hidden');
            loadLevel(scheme, this.dataset.code);
        })
    }
}

function closeModalMenu() {
    for (let $btn of document.getElementsByClassName('img-btn') as unknown as Array<HTMLElement>) {
        $btn.classList.remove('el--hidden')
    }
    document.getElementById('btn-check-levels')!.classList.add('el--hidden');
    document.getElementById('modal-wrapper')!.classList.add('el--hidden');
}

function setPointerStyleAtPatternsModal() {
    // @ts-ignore
    if (window.deleteModalMode && !document.getElementById('modal-pattern-wrapper')!.classList.contains('mode--delete')) {
        document.getElementById('modal-pattern-wrapper')!.classList.add('mode--delete');
    }
    // @ts-ignore
    else if (!window.deleteModalMode && document.getElementById('modal-pattern-wrapper')!.classList.contains('mode--delete')) {
        document.getElementById('modal-pattern-wrapper')!.classList.remove('mode--delete');
    }
};

export function createPatternsModal() : void {
    let menuHtml = '';
    menuHtml += '<span>DELETE PATTERN</span>';
    document.getElementById('menu-of-saved-patterns')!.innerHTML = menuHtml;
    // @ts-ignore
    for (let $elSpan of document.querySelectorAll('#menu-of-saved-patterns span')) {
        $elSpan.addEventListener('click', () => {

            if ('DELETE PATTERN' == $elSpan.innerText) {
                // @ts-ignore
                window.deleteModalMode = !window.deleteModalMode;
                setPointerStyleAtPatternsModal();
                return;
            }
            else {
                // @ts-ignore
                window.deleteModalMode = false;
                setPointerStyleAtPatternsModal();
            }
        })
    }
}