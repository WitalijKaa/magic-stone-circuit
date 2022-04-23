class FactoryGraphics {
    static spriteByPath(filePath) {
        return new PIXI.Sprite(FactoryGraphics.textureByPath(filePath));
    }
    
    static textureByPath(filePath) {
        return PIXI.Texture.from(filePath);
    }
}