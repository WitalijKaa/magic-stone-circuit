const UP = 'Up';
const RIGHT = 'Right';
const DOWN = 'Down';
const LEFT = 'Left';
const SIDES = [UP, RIGHT, DOWN, LEFT];
const SIDES_LEFT_RIGHT = [RIGHT, LEFT];
const SIDES_UP_DOWN = [UP, DOWN];
const SIDES_TURN_90 = {
    [UP]: SIDES_LEFT_RIGHT,
    [DOWN]: SIDES_LEFT_RIGHT,
    [LEFT]: SIDES_UP_DOWN,
    [RIGHT]: SIDES_UP_DOWN,
};
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
        new MouseOver(this, { [MouseOver.MOUSE_OVER]: 'handleMouseOver' });
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
            this.scheme.putContent(Scene.controls.pen, ...this.schemePosition);
        }
        else if (ST_ROAD_SLEEP == Scene.controls.pen || ST_ROAD_AWAKE == Scene.controls.pen) {
            this.changeSemiconductorType(Scene.controls.pen);
        }
        else if (!Scene.controls.pen) {
            this.scheme.removeContent(...this.schemePosition);
            this.changeSemiconductorType(null);
        }
    }
    handleRightClick() {
        if (ST_ROAD == Scene.controls.pen) {
            if (!this.scheme.isRoadBuildMode) {
                this.scheme.startToBuildRoad(...this.schemePosition);
            }
            else {
                this.scheme.finishToBuildRoad(...this.schemePosition);
            }
        }
        else { this.changeSchemeRoad(); }
    }
    handleMouseOver() {
        if (this.scheme.isRoadBuildMode) {
            this.scheme.continueToBuildRoad(...this.schemePosition);
        }
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

    changeSchemeRoad() {
        if (this.scheme.isCellEmpty(...this.schemePosition)) {
            this.scheme.putRoad(...this.schemePosition);
        }
        else if (this.scheme.findCellOrEmpty(...this.schemePosition).road) {
            if (!this.scheme.makeRoadHeavy(...this.schemePosition)) {
                this.scheme.removeRoad(...this.schemePosition);
            }
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
        this.scheme.updatePathsOnNeighborsRoads(...this.schemePosition);
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
            if (this.semiconductor) {
                this.semiconductor.destroyChild('flow');
                this.semiconductor.destroyChild('charge');
            }
            this.destroyChild('semiconductor');
        }
    }

    refreshVisibleAll() {
        this.changeVisibleType();
        this.changeVisibleRoad();
        this.refreshVisibleRoad();
        this.changeVisibleSemiconductor();
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
    get semi() {
        return this.grid.scheme.findSemiconductorCellOrEmpty(...this.schemePosition).semiconductor;
    }

    get scheme() { return this.grid.scheme; }
}