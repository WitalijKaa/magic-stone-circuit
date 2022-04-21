class Sprite {
    static theName(name) { return new Sprite(name); }

    constructor(name) {
        this.name = name;
    }

    texture(texture) {
        this.sprite = new PIXI.Sprite(Texture.db(texture).current);
        Stage.sprite(this);
        return this;
    }
}