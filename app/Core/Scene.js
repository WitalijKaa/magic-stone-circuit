class Scene {

    static schemes = [];
    static currentGrid;
    static currentScheme;

    static addSchemeModel(sceneModel) {
        this.currentGrid = sceneModel; // temp
        this.currentScheme = sceneModel.scheme; // temp
        this.schemes.push(sceneModel.scheme);

        window.pixiApp.stage.addChild(sceneModel.sprite);
        this.addResizeCallbacks(sceneModel);
    }

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

    static eventHandler(eventMethod) {
        if (this[eventMethod]) {
            return;
        }
        if (this.currentScheme[eventMethod]) {
            this.currentScheme[eventMethod]();
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

        let texturePath;
        if (ST_ROAD == this.controls.pen) {
            this.currentGrid.pointedCellZone.showZone(this.currentGrid.lastMouseMovePositions.zone, ...this.currentGrid.lastMouseMovePositions.localGrid);
            texturePath = TT.roadH;
        }
        else {
            this.currentGrid.pointedCellZone.hideZone();
            texturePath = CONTENT_SPRITES.hasOwnProperty(this.controls.pen) ? CONTENT_SPRITES[this.controls.pen] : SEMICONDUCTOR_SPRITES[this.controls.pen];
        }

        if (!this.tempButton) {
            this.tempButton = FactoryGraphics.spriteByPath(texturePath);
            this.tempButton.width = 100;
            this.tempButton.height = 100;
            this.addModel({ sprite: this.tempButton })
        }
        else {
            this.tempButton.texture = FactoryGraphics.textureByPath(texturePath);
        }
    }
}