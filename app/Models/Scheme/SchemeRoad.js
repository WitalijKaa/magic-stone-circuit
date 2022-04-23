const ROAD_LIGHT = 1;
const ROAD_HEAVY = 2;

const ROAD_PATH_UP = 0;
const ROAD_PATH_RIGHT = 1;
const ROAD_PATH_DOWN = 2;
const ROAD_PATH_LEFT = 3;
const ROAD_PATH_HEAVY = 4;

const TT_ROAD = {
    [ROAD_PATH_UP]: TT.roadB,
    [ROAD_PATH_RIGHT]: TT.roadB,
    [ROAD_PATH_DOWN]: TT.roadA,
    [ROAD_PATH_LEFT]: TT.roadA,
    [ROAD_PATH_HEAVY]: TT.energy,
}

const ROTATE_ROAD = {
    [ROAD_PATH_UP]: PIXI_ROTATE_270,
    [ROAD_PATH_RIGHT]: null,
    [ROAD_PATH_DOWN]: PIXI_ROTATE_270,
    [ROAD_PATH_LEFT]: null,
    [ROAD_PATH_HEAVY]: null,
}

class SchemeRoad extends Sprite {

    cell;
    type = ROAD_LIGHT;

    paths = [null, null, null, null, null];

    constructor(config) {
        super(config);
        this.cell = config.cell;
        this.setLightPaths();
        this.correctNeighborsRoads()
    }

    drawPath(type) {
        if (!this.paths[type]) {
            this.paths[type] = Factory.sceneModel({
                model: Sprite,
                name: this.name + '|path' + type,
                texture: {
                    path: TT_ROAD[type],
                    parentModel: this.cell,
                    rotate: ROTATE_ROAD[type],
                },
            });
            Scene.addModelToContainer(this.paths[type], this);
        }
    }

    removePath(type) {
        this.destroyChild('paths', type);
    }

    refreshPaths() {
        this.setLightPaths();
    }

    setLightPaths() {
        if (this.isEmptyAround && !this.emptyMe) { return; }
        if (this.isEmptyAround || this.isEmptyUpDown) {
            this.drawPath(ROAD_PATH_LEFT);
            this.drawPath(ROAD_PATH_RIGHT);
            this.removePath(ROAD_PATH_UP);
            this.removePath(ROAD_PATH_DOWN);
        }
        else if (this.isEmptyLeftRight) {
            this.drawPath(ROAD_PATH_UP);
            this.drawPath(ROAD_PATH_DOWN);
            this.removePath(ROAD_PATH_LEFT);
            this.removePath(ROAD_PATH_RIGHT);
        }
        else {
            if (!this.scheme.isCellEmpty(...this.cell.schemePositionUp)) { this.drawPath(ROAD_PATH_UP); } else { this.removePath(ROAD_PATH_UP); }
            if (!this.scheme.isCellEmpty(...this.cell.schemePositionRight)) { this.drawPath(ROAD_PATH_RIGHT); } else { this.removePath(ROAD_PATH_RIGHT); }
            if (!this.scheme.isCellEmpty(...this.cell.schemePositionDown)) { this.drawPath(ROAD_PATH_DOWN); } else { this.removePath(ROAD_PATH_DOWN); }
            if (!this.scheme.isCellEmpty(...this.cell.schemePositionLeft)) { this.drawPath(ROAD_PATH_LEFT); } else { this.removePath(ROAD_PATH_LEFT); }
        }
    }

    correctNeighborsRoads() {
        SIDES.map((dir) => {
            let cell = this.cell[dir];
            if (cell && cell.road) {
                cell.road.refreshPaths();
            }
        });
    }

    get scheme() { return this.cell.grid.scheme; }

    get isEmptyAround() { return !this.countObjectsAround; }
    get isEmptyUpDown() { return this.scheme.isCellEmpty(...this.cell.schemePositionUp) && this.scheme.isCellEmpty(...this.cell.schemePositionDown); }
    get isEmptyLeftRight() { return this.scheme.isCellEmpty(...this.cell.schemePositionLeft) && this.scheme.isCellEmpty(...this.cell.schemePositionRight); }

    get countObjectsAround() {
        let count = 0;
        if (!this.scheme.isCellEmpty(...this.cell.schemePositionUp)) { count++; }
        if (!this.scheme.isCellEmpty(...this.cell.schemePositionRight)) { count++; }
        if (!this.scheme.isCellEmpty(...this.cell.schemePositionDown)) { count++; }
        if (!this.scheme.isCellEmpty(...this.cell.schemePositionLeft)) { count++; }
        return count;
    }

    get emptyMe() {
        return !this.paths[ROAD_PATH_UP] && !this.paths[ROAD_PATH_RIGHT] && !this.paths[ROAD_PATH_DOWN] && !this.paths[ROAD_PATH_LEFT];
    }
}