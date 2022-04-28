document.addEventListener('contextmenu', event => event.preventDefault());
window.pixiAppContainer = document.getElementById('app');

window.pixiApp = new PIXI.Application({
    width: window.pixiAppContainer.offsetWidth,
    height: window.pixiAppContainer.offsetHeight,
});
window.pixiAppContainer.appendChild(window.pixiApp.view);

Scene.addModel(
    Factory.sceneModel({
        model: SchemeGrid,
        name: 'mainGrid',
        params: {
            cellSizePx: 40, // size of cell without zoom
            cell: {
                model: SchemeCell,
                texture: TT.cell,
            },
        }
    })
);

Scene.controls.pen = ST_STONE_VIOLET;
Scene.setTempButton()
document.addEventListener('keypress', (event) => {
    //console.log('KEY', event.key);
    if (CONTROL_KEYS.hasOwnProperty(event.key)) {
        Scene.controls.pen = CONTROL_KEYS[event.key];
        Scene.setTempButton()
    }
});

function mainContainerResize() {
    window.pixiApp.renderer.resize(window.pixiAppContainer.offsetWidth, window.pixiAppContainer.offsetHeight);
    Scene.resize();
}
window.addEventListener('resize', function() {
    mainContainerResize();
});
