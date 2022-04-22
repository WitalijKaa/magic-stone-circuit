class Scene {
    static addModel(sceneModel) {
        window.pixiApp.stage.addChild(sceneModel.sprite);
    }

    static addModelToContainer(sceneModel, container) {
        container.sprite.addChild(sceneModel.sprite);
    }
}