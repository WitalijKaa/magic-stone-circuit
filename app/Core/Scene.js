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
}