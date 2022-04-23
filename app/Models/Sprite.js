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
            this.sprite = FactoryGraphics.spriteByPath(texture);
        }
        return this;
    }

    get resizeCallbacks() { return []; }

    get x () { return this.sprite.x; }
    get y () { return this.sprite.y; }
    get w () { return this.sprite.width; }
    get h () { return this.sprite.height; }
    set x (val) { this.sprite.x = val; }
    set y (val) { this.sprite.y = val; }
    set w (val) { this.sprite.width = val; }
    set h (val) { this.sprite.height = val; }
}