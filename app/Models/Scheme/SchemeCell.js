class SchemeCell extends Sprite {

    content = null;
    road = null;
    grid = null;

    gridX; gridY;

    constructor(config) {
        super(config);
        this.sprite.interactive = true;
        this.sprite.on('click', () => { this.handleClick() });
        new MouseClick(this, { [MouseClick.CLICK_RIGHT]: 'handleRightClick' });
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

    handleClick() { this.changeType(Scene.controls.pen); }
    handleRightClick() { this.changeRoad(); }

    changeType(type, changeScheme = true) {
        if (!type && !this.content) { return; }
        if (type === this.grid.scheme.getCell(...this.schemePosition).content) { return; }

        if (type) {
            if (!this.content) {
                this.createContent(TT_SCHEME[type]);
                Scene.addModelToContainer(this.content, this);
            }
            else {
                this.content.changeTexture(TT_SCHEME[type], this);
            }
        }
        else { this.destroyChild('content'); }

        if (changeScheme) {
            this.grid.scheme.changeCellContent(type, ...this.schemePosition);
        }
    }

    changeRoad() {
        if (!this.road) {
            this.road = Factory.sceneModel({
                model: SchemeRoad,
                name: this.name + '|road',
                cell: this,
            });
            Scene.addModelToContainer(this.road, this);
            this.grid.scheme.changeCellRoad(ROAD_LIGHT, ...this.schemePosition);
        }
        else {

        }
    }

    createContent(texturePath, param = 'content', rotation = null) {
        this[param] = Factory.sceneModel({
            model: Sprite,
            name: this.name + '|' + param,
            texture: {
                path: texturePath,
                parentModel: this,
            },
        });
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
    get schemePositionLeft() {
        let poss = this.schemePosition;
        poss[0]--;
        return poss
    }
    get schemePositionRight() {
        let poss = this.schemePosition;
        poss[0]++;
        return poss
    }get schemePositionUp() {
        let poss = this.schemePosition;
        poss[1]--;
        return poss
    }get schemePositionDown() {
        let poss = this.schemePosition;
        poss[1]++;
        return poss
    }

    get type() {
        return this.grid.scheme.getCell(...this.schemePosition).content;
    }
}