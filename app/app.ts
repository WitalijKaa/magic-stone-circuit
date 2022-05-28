import {SchemeContainer} from "./Models/Scheme/SchemeContainer";

document.addEventListener('contextmenu', event => event.preventDefault());

import { Application as PixiApplication } from 'pixi.js'
const pixiAppContainer = document.getElementById('app');

import { SchemeStorage } from "./Core/SchemeStorage";
import { SchemeGrid } from "./Models/Scheme/SchemeGrid";

if (pixiAppContainer)
{
    const pixiApp = new PixiApplication({
        width: pixiAppContainer.offsetWidth,
        height: pixiAppContainer.offsetHeight,
    });
    pixiAppContainer.appendChild(pixiApp.view);

    const mainSchemeName = 'mainGrid';

    const schemeStorage = new SchemeStorage();
    const scheme = schemeStorage.getNamedScheme(mainSchemeName);

    const schemeContainer = new SchemeContainer(pixiAppContainer);
    const schemeGrid = new SchemeGrid(mainSchemeName, scheme, schemeContainer);
    pixiApp.stage.addChild(schemeGrid.container);
}
else {
    console.error('no #app div in html :(');
}

/*
let schemeGrid = Factory.sceneModel({
    model: SchemeGrid,
    name: schemeName,
    params: MM.schemeCell,
});

Scene.addSchemeModel(schemeGrid);

// todo preload graphics
setTimeout(() => { schemeGrid.init() }, 500);

Scene.controls.pen = ST_STONE_VIOLET;
Scene.setTempButton()
document.addEventListener('keypress', (event) => {
    if (CONTROL_KEYS.hasOwnProperty(event.key)) {
        schemeGrid.pointedCellZone.hideZone();
        Scene.controls.pen = CONTROL_KEYS[event.key];
        Scene.setTempButton();
    }
    if (CONTROL_EVENTS_KEYS.hasOwnProperty(event.key)) {
        Scene.eventHandler(CONTROL_EVENTS_KEYS[event.key])
    }
    if ('m' == event.key) { Scene.currentScheme.devCellEcho(); }
});

let $buttons = document.getElementsByClassName('img-btn');
for (let $btn of $buttons) {
    let $subscriber = $btn;
    $btn.addEventListener('click', () => {
        Scene.controls.pen = findButtonCode($subscriber);
        Scene.setTempButton()
    })
}

function mainContainerResize() {
    pixiApp.renderer.resize(pixiAppContainer.offsetWidth, pixiAppContainer.offsetHeight);
    Scene.resize();
}
addEventListener('resize', function() {
    mainContainerResize();
});
*/
