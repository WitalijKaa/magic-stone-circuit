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
        else if (texture) {
            if (texture.parentModel) {
                this.sprite = FactoryGraphics.spriteByPathInsideParentSpriteModel(
                    texture.path,
                    texture.parentModel,
                    texture.rotate,
                );
            }
            else {
                this.sprite = FactoryGraphics.spriteByPath(texture.path);
            }
        }
        return this;
    }

    changeTexture(filePath, parentModel, rotate = null) {
        if (!parentModel) {
            this.sprite.texture = FactoryGraphics.textureByPath(filePath);
        }
        else {
            this.sprite.texture = FactoryGraphics.textureByPathInsideParentSprite(filePath, parentModel.sprite, rotate);
        }
    }

    destroyChild(param, ix = null) {
        if (!this[param]) { return; }
        if ('number' == typeof ix) {
            if (!this[param][ix]) { return; }
            this.sprite.removeChild(this[param][ix].sprite);
            this[param][ix].sprite.destroy();
            this[param][ix] = null;
        }
        else {
            this.sprite.removeChild(this[param].sprite);
            this[param].sprite.destroy();
            this[param] = null;
        }
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