class Sprite {

    sprite = null;

    constructor(config) {
        this.name = config.name;
        this.initTexture(config.texture);
    }

    initTexture(texture) {
        if (typeof texture == 'string') {
            this.sprite = FactoryGraphics.spriteByString(texture);
        }
        return this;
    }
}