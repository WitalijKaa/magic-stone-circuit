import * as CONTROL from "./config/controls";

document.addEventListener('contextmenu', event => event.preventDefault());

import { Application as PixiApplication } from '@pixi/app';
const pixiAppContainer = document.getElementById('app');

import {SchemeContainer} from "./Models/Scheme/SchemeContainer";
import {SchemeStorage} from "./Core/SchemeStorage";
import {SchemeGrid} from "./Models/Scheme/SchemeGrid";
import {FactoryGraphics} from "./Core/FactoryGraphics";
import {SpriteModel} from "./Models/SpriteModel";
import {
    findButtonCode,
    loadLevel,
    loadScheme,
    openModal,
    SWITCH_TO_OTHER_SCHEME,
    viewControlPen
} from "./config/controls";
import {Scheme} from "./Core/Scheme";
import {DEFAULT_SCHEME_NAME} from "./config/game";
import {LEVELS} from "./config/levels";

if (pixiAppContainer)
{
    const pixiApp = new PixiApplication({
        width: pixiAppContainer.offsetWidth,
        height: pixiAppContainer.offsetHeight,
    });
    pixiAppContainer.appendChild(pixiApp.view);

    const loader = new FactoryGraphics();
    SpriteModel.implementGraphics(loader);
    loader.loadTextures(() => {
        const schemeStorage = new SchemeStorage();
        const scheme = new Scheme();

        const schemeContainer = new SchemeContainer(pixiAppContainer);
        const schemeGrid = new SchemeGrid(scheme, schemeContainer);
        pixiApp.stage.addChild(schemeGrid.container);

        scheme.setSaveToStorageMethod(schemeStorage.saveCallback());
        scheme.loadScheme(schemeStorage.load(scheme.scheme));

        let $name = document.getElementById('scheme-name');
        if ($name) { $name.innerText = DEFAULT_SCHEME_NAME; }

        function mainContainerResize() {
            if (!pixiAppContainer || !schemeGrid) { return; }
            pixiApp.renderer.resize(pixiAppContainer.offsetWidth, pixiAppContainer.offsetHeight);
            schemeGrid.resetVisibleGrid();
        }
        window.addEventListener('resize', function() {
            mainContainerResize();
        });

        document.addEventListener('keypress', (event) => {
            scheme.beforeAnyInput();
            if (CONTROL.CONTROL_KEYS.hasOwnProperty(event.key)) {
                schemeGrid.controlPen = CONTROL.CONTROL_KEYS[event.key];
                viewControlPen(schemeGrid.controlPen);
            }
            schemeGrid.controlEvent = event.key;
            if (SWITCH_TO_OTHER_SCHEME.includes(event.key)) {
                openModal(scheme, schemeStorage);
            }
        });

        viewControlPen(schemeGrid.controlPen);

        let $buttons = document.getElementsByClassName('img-btn') as unknown as Array<HTMLElement>;
        for (let $btn of $buttons) {
            let $subscriber = $btn;
            $btn.addEventListener('click', () => {
                scheme.beforeAnyInput();
                let pen: any = +findButtonCode($subscriber) ? +findButtonCode($subscriber) : findButtonCode($subscriber);
                if (CONTROL.CONTROL_KEYS.hasOwnProperty(pen)) {
                    schemeGrid.controlPen = pen;
                    viewControlPen(pen);
                }
                schemeGrid.controlEvent = pen;
                if (SWITCH_TO_OTHER_SCHEME.includes(pen)) {
                    openModal(scheme, schemeStorage);
                }
            })
        }

        let menuHtml = '';
        menuHtml += '<span>RESET</span>';
        menuHtml += '<span>NEW SCHEME</span>';
        document.getElementById('menu-schemes')!.innerHTML = menuHtml;
        // @ts-ignore
        for (let $elSpan of document.querySelectorAll('#menu-schemes span')) {
            $elSpan.addEventListener('click', () => {
                document.getElementById('modal-wrapper')!.classList.add('el--hidden');
                loadScheme(scheme, schemeStorage, $elSpan.innerText);
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
                document.getElementById('modal-wrapper')!.classList.add('el--hidden');
                loadLevel(scheme, schemeStorage, this.dataset.code);
            })
        }
    });
}
else {
    console.error('no #app div in html :(');
}
