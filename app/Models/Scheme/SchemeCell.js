const UP = 'Up';
const RIGHT = 'Right';
const DOWN = 'Down';
const LEFT = 'Left';
const SIDES = [UP, RIGHT, DOWN, LEFT]

class SchemeCell extends Sprite {

    content = null;
    road = null;
    grid = null;

    Up; Right; Left; Down;
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

    initNeighbors() {
        SIDES.map((dir) => {
            this[dir] = this.grid.getVisibleCell(...this.getVisiblePosition(dir));
        });
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
            this.grid.scheme.changeCellRoad(ROAD_LIGHT, ...this.schemePosition);
            this.road = Factory.sceneModel({
                model: SchemeRoad,
                name: this.name + '|road',
                cell: this,
            });
            Scene.addModelToContainer(this.road, this);
        }
        else {
            this.grid.scheme.changeCellRoad(null, ...this.schemePosition);
            this.road.correctNeighborsRoads();
            this.destroyChild('road');
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

    moveUp(changeScheme = true) { this.moveByDirection(changeScheme, UP); }
    moveRight(changeScheme = true) { this.moveByDirection(changeScheme, RIGHT); }
    moveDown(changeScheme = true) { this.moveByDirection(changeScheme, DOWN); }
    moveLeft(changeScheme = true) { this.moveByDirection(changeScheme, LEFT); }
    moveByDirection(changeScheme, dir) {
        let cell = this.grid.getVisibleCell(...this.getVisiblePosition(dir));
        if (cell) {
            cell.changeType(this.type, changeScheme);
        }
        else if (!changeScheme) {
            this.changeType(null, changeScheme);
        }
        if (changeScheme) { this.changeType(null); }
    }

    getVisiblePosition(dir) { return this['visiblePosition' + dir]; }
    get visiblePosition() { return [this.gridX + SchemeGrid.GRID_OFFSET, this.gridY + SchemeGrid.GRID_OFFSET]; }
    get visiblePositionLeft() { let poss = this.visiblePosition; poss[0]--; return poss }
    get visiblePositionRight() { let poss = this.visiblePosition; poss[0]++; return poss }
    get visiblePositionUp() { let poss = this.visiblePosition; poss[1]--; return poss }
    get visiblePositionDown() { let poss = this.visiblePosition; poss[1]++; return poss }

    get schemePosition() { return [this.grid.dragX + this.gridX, this.grid.dragY + this.gridY]; }
    get schemePositionLeft() { let poss = this.schemePosition; poss[0]--; return poss }
    get schemePositionRight() { let poss = this.schemePosition; poss[0]++; return poss }
    get schemePositionUp() { let poss = this.schemePosition; poss[1]--; return poss }
    get schemePositionDown() { let poss = this.schemePosition; poss[1]++; return poss }

    get type() {
        return this.grid.scheme.getCell(...this.schemePosition).content;
    }
}