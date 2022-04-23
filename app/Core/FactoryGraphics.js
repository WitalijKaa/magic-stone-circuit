class FactoryGraphics {
    static spriteByPathInsideParentSpriteModel(filePath, parentSpriteModel, rotate = null) {
        return new PIXI.Sprite(FactoryGraphics.textureByPathInsideParentSprite(filePath, parentSpriteModel.sprite, rotate));
    }

    static textureByPathInsideParentSprite(filePath, parentSprite, rotate = null) {
        console.log(rotate);
        return new PIXI.Texture(
            PIXI.BaseTexture.from(filePath),
            null,
            new PIXI.Rectangle(0, 0, parentSprite.texture.width, parentSprite.texture.height),
            null,
            rotate
        );
    }

    static spriteByPath(filePath) {
        return new PIXI.Sprite(FactoryGraphics.textureByPath(filePath));
    }
    
    static textureByPath(filePath) {
        return PIXI.Texture.from(filePath);
    }
}