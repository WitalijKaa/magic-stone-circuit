class FactoryGraphics {
    static spriteByPathInsideParentSpriteModel(filePath, parentSpriteModel, rotate = null) {
        return new PIXI.Sprite(FactoryGraphics.textureByPathInsideParentSprite(filePath, parentSpriteModel.sprite, rotate));
    }

    static textureByPathInsideParentSprite(filePath, parentSprite, rotate = null) {
        return new PIXI.Texture(
            PIXI.BaseTexture.from(filePath),
            null,
            new PIXI.Rectangle(0, 0, parentSprite.texture.width, parentSprite.texture.height),
            null,
            rotate
        );
    }

    static spriteByPath(filePath, rotate = null) {
        return new PIXI.Sprite(FactoryGraphics.textureByPath(filePath, rotate));
    }
    
    static textureByPath(filePath, rotate) {
        return new PIXI.Texture(
            PIXI.BaseTexture.from(filePath),
            null,
            null,
            null,
            rotate
        );
    }
}