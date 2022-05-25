document.addEventListener('contextmenu', event => event.preventDefault());
window.pixiAppContainer = document.getElementById('app');

window.pixiApp = new PIXI.Application({
    width: window.pixiAppContainer.offsetWidth,
    height: window.pixiAppContainer.offsetHeight,
});
window.pixiAppContainer.appendChild(window.pixiApp.view);

let schemeName = 'mainGrid';
let scheme = Scheme.getNamedScheme(schemeName);
scheme.setStorage(new StorageScheme());

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
    window.pixiApp.renderer.resize(window.pixiAppContainer.offsetWidth, window.pixiAppContainer.offsetHeight);
    Scene.resize();
}
window.addEventListener('resize', function() {
    mainContainerResize();
});
