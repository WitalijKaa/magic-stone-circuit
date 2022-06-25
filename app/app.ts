document.addEventListener('contextmenu', event => event.preventDefault());

import { Application as PixiApplication } from '@pixi/app';
const pixiAppContainer = document.getElementById('app');

import {SchemeContainer} from "./Models/Scheme/SchemeContainer";
import {SchemeStorage} from "./Core/SchemeStorage";
import {SchemeGrid} from "./Models/Scheme/SchemeGrid";
import {FactoryGraphics} from "./Core/FactoryGraphics";
import {SpriteModel} from "./Models/SpriteModel";
import {
    addPenHandlers,
    createModal,
    viewControlPen
} from "./config/controls";
import {Scheme} from "./Core/Scheme";
import {DEFAULT_SCHEME_NAME} from "./config/game";

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

        viewControlPen(schemeGrid.controlPen);

        addPenHandlers(scheme, schemeStorage, schemeGrid);
        createModal(scheme, schemeStorage);
    });
}
else {
    console.error('no #app div in html :(');
}
