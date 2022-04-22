class SchemeCell extends Sprite {

    content = null;
    grid = null;

    gridX; gridY;

    constructor(config) {
        super(config);
        this.sprite.interactive = true;
        this.sprite.on('click', () => { this.handleClick() });
    }

    init (grid) {
        this.grid = grid;
        return this;
    }

    setSize(px, updatePosition = true) {
        this.sprite.width = this.sprite.height = px;
        if (updatePosition) { this.updatePosition(); }
        return this;
    }

    setPosition(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.updatePosition();
        return this;
    }

    updatePosition() {
        this.sprite.x = this.gridX * this.sprite.width + this.grid.offsetX;
        this.sprite.y = this.gridY * this.sprite.height + this.grid.offsetY;
        return this;
    }

    handleClick() {
        this.content = FactoryGraphics.spriteByString(TT.stoneV);
        this.sprite.addChild(this.content);
    }
}