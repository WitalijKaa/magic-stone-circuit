class SchemeCell extends Sprite {

    content = null;

    constructor(config) {
        super(config);
        this.sprite.interactive = true;
        this.sprite.on('click', () => { this.handleClick() });
    }

    setVisibleCellPosition(sizePx, gridX, gridY) {
        this.sprite.width = this.sprite.height = sizePx;
        this.sprite.x = gridX * sizePx;
        this.sprite.y = gridY * sizePx;
    }

    handleClick() {
        this.content = FactoryGraphics.spriteByString(TT.stoneV);
        this.sprite.addChild(this.content);
    }
}