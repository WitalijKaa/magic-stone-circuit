import * as CONTROL from "./config/controls";

document.addEventListener('contextmenu', event => event.preventDefault());

import { Application as PixiApplication } from '@pixi/app';
const pixiAppContainer = document.getElementById('app');

import {SchemeContainer} from "./Models/Scheme/SchemeContainer";
import {SchemeStorage} from "./Core/SchemeStorage";
import {SchemeGrid} from "./Models/Scheme/SchemeGrid";
import {FactoryGraphics} from "./Core/FactoryGraphics";
import {SpriteModel} from "./Models/SpriteModel";
import {findButtonCode, loadScheme, viewControlPen} from "./config/controls";
import {Scheme} from "./Core/Scheme";

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
        const mainSchemeName = 'mainGrid';

        const schemeStorage = new SchemeStorage();
        const scheme = new Scheme(mainSchemeName);

        const schemeContainer = new SchemeContainer(pixiAppContainer);
        const schemeGrid = new SchemeGrid(mainSchemeName, scheme, schemeContainer);
        pixiApp.stage.addChild(schemeGrid.container);

        scheme.setSaveToStorageMethod(schemeStorage.save.bind(schemeStorage, mainSchemeName));
        scheme.loadScheme(schemeStorage.load(scheme.scheme, mainSchemeName));

        function mainContainerResize() {
            if (!pixiAppContainer || !schemeGrid) { return; }
            pixiApp.renderer.resize(pixiAppContainer.offsetWidth, pixiAppContainer.offsetHeight);
            schemeGrid.resetVisibleGrid();
        }
        window.addEventListener('resize', function() {
            mainContainerResize();
        });

        document.addEventListener('keypress', (event) => {
            if (CONTROL.CONTROL_KEYS.hasOwnProperty(event.key)) {
                schemeGrid.controlPen = CONTROL.CONTROL_KEYS[event.key];
                viewControlPen(schemeGrid.controlPen);
            }
            schemeGrid.controlEvent = event.key;
            loadScheme(event.key, mainSchemeName, scheme, schemeStorage);
        });

        viewControlPen(schemeGrid.controlPen);

        let $buttons = document.getElementsByClassName('img-btn') as unknown as Array<HTMLElement>;
        for (let $btn of $buttons) {
            let $subscriber = $btn;
            $btn.addEventListener('click', () => {
                let pen: any = +findButtonCode($subscriber) ? +findButtonCode($subscriber) : findButtonCode($subscriber);
                if (CONTROL.CONTROL_KEYS.hasOwnProperty(pen)) {
                    schemeGrid.controlPen = pen;
                    viewControlPen(pen);
                }
                schemeGrid.controlEvent = pen;
                loadScheme(pen, mainSchemeName, scheme, schemeStorage);
            })
        }
    });
}
else {
    console.error('no #app div in html :(');
}
