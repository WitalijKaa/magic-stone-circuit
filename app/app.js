window.pixiAppContainer = document.getElementById('app');

window.pixiApp = new PIXI.Application({
    width: window.pixiAppContainer.offsetWidth,
    height: window.pixiAppContainer.offsetHeight,
});
window.pixiAppContainer.appendChild(window.pixiApp.view);

SCENE.map((sceneModel) => {
    Scene.addModel(
        Factory.sceneModel(sceneModel)
    );
});

function mainContainerResize() {
    window.pixiApp.renderer.resize(window.pixiAppContainer.offsetWidth, window.pixiAppContainer.offsetHeight);
}

window.addEventListener('resize', function() {
    mainContainerResize();
});
