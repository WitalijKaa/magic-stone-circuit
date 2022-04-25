const UP = 'Up';
const RIGHT = 'Right';
const DOWN = 'Down';
const LEFT = 'Left';
const SIDES = [UP, RIGHT, DOWN, LEFT];
const OPPOSITE_SIDE = {
    [UP]: DOWN,
    [DOWN]: UP,
    [LEFT]: RIGHT,
    [RIGHT]: LEFT,
};

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

    handleClick() { this.changeSchemeType(Scene.controls.pen); }
    handleRightClick() { this.changeSchemeRoad(); }

    changeSchemeType(type) {
        this.grid.scheme.changeCellContent(type, ...this.schemePosition);
        this.changeVisibleType();
        this.setColorAround();
    }

    changeVisibleType() {
        if (this.type) {
            if (!this.content) {
                this.createContent(TT_SCHEME[this.type]);
                Scene.addModelToContainer(this.content, this);
            }
            else {
                this.content.changeTexture(TT_SCHEME[this.type], this);
            }
        }
        else { this.destroyChild('content'); }
    }

    setColorAround() {
        if (STONE_TYPE_TO_ROAD_COLOR.hasOwnProperty(this.type)) {
            let color = STONE_TYPE_TO_ROAD_COLOR[this.type];
            SIDES.map((sideTo) => {
                this.grid.scheme.setColorToRoad(color, OPPOSITE_SIDE[sideTo], ...this['schemePosition' + sideTo])
            });
        }
    }

    changeSchemeRoad() {
        if (!this.typeOfRoad) {
            this.grid.scheme.changeCellRoad({ type: ROAD_LIGHT, paths: [false, false, false, false, false] }, ...this.schemePosition);
            this.grid.scheme.resetPathsOnRoad(...this.schemePosition);
        }
        else {
            if (this.road.makeHeavy()) {
                this.grid.scheme.resetPathsOnRoad(...this.schemePosition);
                this.road.refreshPaths();
            }
            else { this.grid.scheme.changeCellRoad(null, ...this.schemePosition); }
        }
        this.grid.scheme.resetPathsOnNeighborsRoads(...this.schemePosition);
        this.execForNeighborsRoads('refreshPaths')
        this.changeVisibleRoad()
    }
    
    changeVisibleRoad() {
        if (this.typeOfRoad && !this.road) {
            this.road = this.createRoadModel();
            Scene.addModelToContainer(this.road, this);
        }
        else if (!this.typeOfRoad) {
            this.destroyChild('road');
        }
    }
    refreshVisibleRoad() { this.road && this.road.refreshPaths(); }

    createRoadModel() {
        return Factory.sceneModel({
            model: SchemeRoad,
            name: this.name + '|road',
            cell: this,
        });
    }

    execForNeighborsRoads(method, params = [], allowedDirs = null) {
        SIDES.map((side) => {
            if (allowedDirs && !allowedDirs.includes(side)) { return; }

            let cell = this[side];
            if (cell && cell.road) {
                cell.road[method](...params);
            }
        });
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
    get typeOfRoad() {
        return this.grid.scheme.getCell(...this.schemePosition).road ? this.grid.scheme.getCell(...this.schemePosition).road.type : false;
    }
}