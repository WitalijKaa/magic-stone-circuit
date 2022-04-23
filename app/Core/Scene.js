class Scene {
    static addModel(sceneModel) {
        window.pixiApp.stage.addChild(sceneModel.sprite);
        this.addResizeCallbacks(sceneModel);
    }

    static addModelToContainer(sceneModel, container, ix = false) {
        if (false === ix) {
            container.sprite.addChild(sceneModel.sprite);
        }
        else {
            container.sprite.addChildAt(sceneModel.sprite, ix);
        }
        this.addResizeCallbacks(sceneModel);
    }

    static addResizeCallbacks(sceneModel) {
        let resizeCallbacks = sceneModel.resizeCallbacks;
        if (resizeCallbacks && resizeCallbacks.length) {
            this.resizeCallbacks.push(...resizeCallbacks);
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
        this.resizeCallbacks.forEach(callback => callback(this.widthPx, this.heightPx));
    }

    static controls = {
        pen: null,
    }

    // todo
    static tempButton;
    static setTempButton() {
        if (!this.controls.pen) {
            if (this.tempButton) {
                this.tempButton.destroy();
            }
            this.tempButton = null;
            return;
        }

        if (!this.tempButton) {
            this.tempButton = FactoryGraphics.spriteByPath(TT_SCHEME[this.controls.pen]);
            this.tempButton.width = 100;
            this.tempButton.height = 100;
            this.addModel({ sprite: this.tempButton })
        }
        else {
            this.tempButton.texture = FactoryGraphics.textureByPath(TT_SCHEME[this.controls.pen]);
        }
    }
}