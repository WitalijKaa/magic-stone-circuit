export function mainContainerResize(pixiApp, pixiAppContainer, schemeGrid) {
    window.addEventListener('resize', function() {
        if (!pixiAppContainer || !schemeGrid) { return; }
        pixiApp.renderer.resize(pixiAppContainer.offsetWidth, pixiAppContainer.offsetHeight);
        schemeGrid.resetVisibleGrid();
    });
}