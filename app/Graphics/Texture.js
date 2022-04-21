class Texture {
    static db(file) { return new Texture(file); }

    constructor(required) {
        this.current = PIXI.Texture.from(required);
    }
}
