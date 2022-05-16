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
    static setTempButton() {
        let $el = document.querySelector('[data-tip="' + this.controls.pen + '"]');
        if ($el) {
            document.getElementById('current-btn').style.backgroundImage = "url('" + $el.currentSrc + "')";
        }
    }
}