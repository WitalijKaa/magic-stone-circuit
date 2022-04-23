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
        this.w = this.h = px;
        if (updatePosition) { this.updatePosition(); }
        return this;
    }

    setPosition(gridX, gridY) {
        this.gridX = gridX - SchemeGrid.GRID_OFFSET;
        this.gridY = gridY - SchemeGrid.GRID_OFFSET;
        this.updatePosition();
        return this;
    }

    updatePosition() {
        this.x = this.gridX * this.w + this.grid.offsetX;
        this.y = this.gridY * this.h + this.grid.offsetY;
        return this;
    }

    handleClick() {
        this.changeType(Scene.controls.pen);
    }

    changeType(type, changeScheme = true) {
        if (!type && !this.content) { return; }
        if (type === this.grid.scheme.getCell(...this.schemePosition)) { return; }

        if (this.content) {
            this.sprite.removeChildAt(0);
            this.content.destroy();
            this.content = null;
        }
        if (type) {
            this.content = FactoryGraphics.spriteByPathInsideParentSpriteModel(TT_SCHEME[type], this);
            Scene.addModelToContainer({sprite: this.content}, this, 0);
        }

        if (changeScheme) {
            this.grid.scheme.changeCell(type, ...this.schemePosition);
        }
    }

    moveLeft(changeScheme = true) {
        let poss = this.visiblePosition;
        if (poss[0]) {
            this.grid.visibleCells[poss[0] - 1][poss[1]].changeType(this.type, changeScheme)
        }
        if (!poss[0] && !changeScheme) {
            this.changeType(null, changeScheme);
        }
        if (changeScheme) { this.changeType(null); }
    }
    moveRight(changeScheme = true) {
        let poss = this.visiblePosition;
        if (poss[0] < this.grid.visibleCells.length - 1) {
            this.grid.visibleCells[poss[0] + 1][poss[1]].changeType(this.type, changeScheme)
        }
        if (poss[0] >= this.grid.visibleCells.length - 1 && !changeScheme) {
            this.changeType(null, changeScheme);
        }
        if (changeScheme) { this.changeType(null); }
    }
    moveUp(changeScheme = true) {
        let poss = this.visiblePosition;
        if (poss[1]) {
            this.grid.visibleCells[poss[0]][poss[1] - 1].changeType(this.type, changeScheme)
        }
        if (!poss[1] && !changeScheme) {
            this.changeType(null, changeScheme);
        }
        if (changeScheme) { this.changeType(null); }
    }
    moveDown(changeScheme = true) {
        let poss = this.visiblePosition;
        if (poss[1] < this.grid.visibleCells[0].length - 1) {
            this.grid.visibleCells[poss[0]][poss[1] + 1].changeType(this.type, changeScheme)
        }
        if (poss[1] >= this.grid.visibleCells[0].length - 1 && !changeScheme) {
            this.changeType(null, changeScheme);
        }
        if (changeScheme) { this.changeType(null); }
    }

    get visiblePosition() {
        return [this.gridX + SchemeGrid.GRID_OFFSET, this.gridY + SchemeGrid.GRID_OFFSET];
    }

    get schemePosition() {
        return [this.grid.dragX + this.gridX, this.grid.dragY + this.gridY];
    }

    get type() {
        return this.grid.scheme.getCell(...this.schemePosition);
    }
}