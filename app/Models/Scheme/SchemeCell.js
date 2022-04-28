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
    semiconductor = null;
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

    handleClick() {
        if (CONTENT_SPRITES.hasOwnProperty(Scene.controls.pen)) {
            this.changeSchemeType(Scene.controls.pen);
        }
        else if (ST_ROAD_SLEEP == Scene.controls.pen || ST_ROAD_AWAKE == Scene.controls.pen) {
            this.changeSemiconductorType(Scene.controls.pen);
        }
        else if (!Scene.controls.pen) {
            this.changeSchemeType(null);
            this.changeSemiconductorType(null);
        }
    }
    handleRightClick() { this.changeSchemeRoad(); }

    changeSchemeType(type) {
        this.grid.scheme.changeCellContent(type, ...this.schemePosition);
        this.refreshVisibleAll();
        this.setColorAround();
    }

    changeVisibleType() {
        if (this.type) {
            if (!this.content) {
                this.content = Factory.sceneModel({
                    model: Sprite,
                    name: this.name + '|content',
                    texture: {
                        path: CONTENT_SPRITES[this.type],
                        parentModel: this,
                    },
                });
                Scene.addModelToContainer(this.content, this);
            }
            else {
                this.content.changeTexture(CONTENT_SPRITES[this.type], this);
            }
        }
        else { this.destroyChild('content'); }
    }

    setColorAround() {
        let color = null
        if (STONE_TYPE_TO_ROAD_COLOR.hasOwnProperty(this.type)) {
            color = STONE_TYPE_TO_ROAD_COLOR[this.type];
        }
        SIDES.map((sideTo) => {
            let position = this['schemePosition' + sideTo];
            this.scheme.setColorToRoad(color, OPPOSITE_SIDE[sideTo], ...position)
            this.scheme.setColorToAwakeSemiconductor(color, ...position)
        });
    }

    changeSchemeRoad() {
        if (this.scheme.isCellEmpty(...this.schemePosition)) {
            this.scheme.putRoad(...this.schemePosition);
        }
        else if (this.road) {
            if (this.road.makeHeavy()) {
                this.scheme.resetPathsOnRoad(...this.schemePosition);
                this.road.refreshPaths();
                this.scheme.doCheckRunForRoads(...this.schemePosition);
            }
            else { this.scheme.removeRoad(...this.schemePosition); }
        }
    }
    
    changeVisibleRoad() {
        if (this.typeOfRoad && !this.road) {
            this.road = Factory.sceneModel({
                model: SchemeRoad,
                name: this.name + '|road',
                cell: this,
            });
            Scene.addModelToContainer(this.road, this);
        }
        else if (!this.typeOfRoad) {
            this.destroyChild('road');
        }
    }
    refreshVisibleRoad() { this.road && this.road.refreshPaths(); }

    changeSemiconductorType(scType) {
        this.scheme.putSemiconductor(scType, ...this.schemePosition);
        this.refreshVisibleAll();
        this.scheme.resetPathsOnNeighborsRoads(...this.schemePosition);
        this.execForNeighborsRoads('refreshPaths')
    }

    changeVisibleSemiconductor() {
        if (this.typeOfSemiconductor) {
            if (!this.semiconductor) {
                this.semiconductor = Factory.sceneModel({
                    model: SchemeSemiconductor,
                    name: this.name + '|semiconductor',
                    cell: this,
                });
                Scene.addModelToContainer(this.semiconductor, this);
            }
            else {
                this.semiconductor.refreshTexture();
            }
        }
        else if (!this.typeOfSemiconductor) {
            this.destroyChild('semiconductor');
        }
    }

    refreshVisibleAll() {
        this.changeVisibleType();
        this.changeVisibleRoad();
        this.refreshVisibleRoad();
        this.changeVisibleSemiconductor();
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
        return this.grid.scheme.findCellOrEmpty(...this.schemePosition).content;
    }
    get typeOfRoad() {
        return this.grid.scheme.findCellOrEmpty(...this.schemePosition).road ? this.grid.scheme.findCellOrEmpty(...this.schemePosition).road.type : false;
    }
    get typeOfSemiconductor() {
        return this.grid.scheme.findCellOrEmpty(...this.schemePosition).semiconductor ? this.grid.scheme.findCellOrEmpty(...this.schemePosition).semiconductor.type : false;
    }
    get colorOfSemiconductor() {
        return this.grid.scheme.findCellOrEmpty(...this.schemePosition).semiconductor ? this.grid.scheme.findCellOrEmpty(...this.schemePosition).semiconductor.color : null;
    }

    get scheme() { return this.grid.scheme; }
}