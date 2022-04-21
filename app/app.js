window.pixiAppContainer = document.getElementById('app');

window.pixiApp = new PIXI.Application({
    width: window.pixiAppContainer.offsetWidth,
    height: window.pixiAppContainer.offsetHeight,
});
window.pixiAppContainer.appendChild(window.pixiApp.view);

SCENE.menuOfObjects.content.buttonSource.model.theName('buttonSource').texture(SCENE.menuOfObjects.content.buttonSource.sprite);

function mainContainerResize() {
    window.pixiApp.renderer.resize(window.pixiAppContainer.offsetWidth, window.pixiAppContainer.offsetHeight);
}

window.addEventListener('resize', function() {
    mainContainerResize();
});

