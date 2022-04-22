class Scene {
    static addModel(sceneModel) {
        window.pixiApp.stage.addChild(sceneModel.sprite);
        Scene.addResizeCallbacks(sceneModel);
    }

    static addModelToContainer(sceneModel, container) {
        container.sprite.addChild(sceneModel.sprite);
        Scene.addResizeCallbacks(sceneModel);
    }

    static addResizeCallbacks(sceneModel) {
        let resizeCallbacks = sceneModel.resizeCallbacks;
        if (resizeCallbacks.length) {
            Scene.resizeCallbacks.push(...resizeCallbacks);
        }
    }

    static get widthPx() {
        return window.pixiAppContainer.offsetWidth;
    }
    static get heightPx() {
        return window.pixiAppContainer.offsetHeight;
    }

    static get deviceRation() {
        return devicePixelRatio;
    }

    static resizeCallbacks = [];
    static resize() {
        Scene.resizeCallbacks.forEach(callback => callback(Scene.widthPx, Scene.heightPx));
    }

    static controls = {
        pen: null,
    }

    // todo
    static tempButton;
    static setTempButton() {
        if (Scene.tempButton) {
            Scene.tempButton.destroy();
        }
        if (!Scene.controls.pen) { Scene.tempButton = null; return; }

        Scene.tempButton = FactoryGraphics.spriteByString(TT_SCHEME[Scene.controls.pen])
        Scene.tempButton.width = 100;
        Scene.tempButton.height = 100;
        window.pixiApp.stage.addChild(Scene.tempButton);
    }
}