import * as CONTROL from "./config/controls";
import { SchemeContainer } from "./Models/Scheme/SchemeContainer";

document.addEventListener('contextmenu', event => event.preventDefault());

import { Application as PixiApplication } from 'pixi.js'
const pixiAppContainer = document.getElementById('app');

import { SchemeStorage } from "./Core/SchemeStorage";
import { SchemeGrid } from "./Models/Scheme/SchemeGrid";
import { FactoryGraphics } from "./Core/FactoryGraphics";
import {SpriteModel} from "./Models/SpriteModel";

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
        const scheme = schemeStorage.getNamedScheme(mainSchemeName);

        const schemeContainer = new SchemeContainer(pixiAppContainer);
        const schemeGrid = new SchemeGrid(mainSchemeName, scheme, schemeContainer);
        pixiApp.stage.addChild(schemeGrid.container);

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
                //Scene.setTempButton();
            }
            if (CONTROL.CONTROL_EVENTS_KEYS.hasOwnProperty(event.key)) {
                //Scene.eventHandler(CONTROL.CONTROL_EVENTS_KEYS[event.key])
            }
            if ('m' == event.key) { schemeGrid.scheme.devCellEcho(); }
        });
    });
}
else {
    console.error('no #app div in html :(');
}
