document.addEventListener('contextmenu', event => event.preventDefault());
window.pixiAppContainer = document.getElementById('app');

window.pixiApp = new PIXI.Application({
    width: window.pixiAppContainer.offsetWidth,
    height: window.pixiAppContainer.offsetHeight,
});
window.pixiAppContainer.appendChild(window.pixiApp.view);

SCENE.map((sceneModelConfig) => {
    Scene.addModel(
        Factory.sceneModel(sceneModelConfig)
    );
});

function mainContainerResize() {
    window.pixiApp.renderer.resize(window.pixiAppContainer.offsetWidth, window.pixiAppContainer.offsetHeight);
    Scene.resize();
}

window.addEventListener('resize', function() {
    mainContainerResize();
});
