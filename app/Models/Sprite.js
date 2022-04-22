class Sprite {

    sprite = null;
    configParams = {};

    constructor(config) {
        this.name = config.name;
        this.initTexture(config.texture);
        if (!this.sprite) {
            this.sprite = new PIXI.Container();
        }
        if (config.params) {
            this.configParams = { ...config.params };
        }
    }

    initTexture(texture) {
        if (typeof texture == 'string') {
            this.sprite = FactoryGraphics.spriteByString(texture);
        }
        return this;
    }

    get resizeCallbacks() { return []; }
}