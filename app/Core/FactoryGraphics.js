class FactoryGraphics {
    static spriteByString(filePath) {
        return new PIXI.Sprite(PIXI.Texture.from(filePath));
    }
}