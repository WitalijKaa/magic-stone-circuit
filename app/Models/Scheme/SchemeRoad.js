const ROAD_LIGHT = 1;
const ROAD_HEAVY = 2;
const ROAD_LEFT_RIGHT = 3;
const ROAD_UP_DOWN = 4;

const ROAD_PATH_UP = 0;
const ROAD_PATH_RIGHT = 1;
const ROAD_PATH_DOWN = 2;
const ROAD_PATH_LEFT = 3;
const ROAD_PATH_HEAVY = 4;

const SIDE_TO_ROAD_PATH = {
    [UP]: ROAD_PATH_UP,
    [RIGHT]: ROAD_PATH_RIGHT,
    [DOWN]: ROAD_PATH_DOWN,
    [LEFT]: ROAD_PATH_LEFT,
};

const TT_ROAD = {
    [ROAD_PATH_UP]: TT.roadB,
    [ROAD_PATH_RIGHT]: TT.roadB,
    [ROAD_PATH_DOWN]: TT.roadA,
    [ROAD_PATH_LEFT]: TT.roadA,
    [ROAD_PATH_HEAVY]: TT.roadH,
}

const ROTATE_ROAD = {
    [ROAD_PATH_UP]: PIXI_ROTATE_270,
    [ROAD_PATH_DOWN]: PIXI_ROTATE_270,
}

class SchemeRoad extends Sprite {

    cell;
    type = ROAD_LIGHT;

    paths = [null, null, null, null, null];

    constructor(config) {
        super(config);
        this.cell = config.cell;
        this.refreshPaths();
        this.correctNeighborsRoads();
    }

    makeHeavy() {
        if (ROAD_HEAVY == this.type || this.countObjectsAround < 3) { return false; }
        this.type = ROAD_HEAVY;
        this.refreshPaths();
        this.correctNeighborsRoads();
        return true;
    }

    drawPath(type) {
        if (!this.paths[type]) {
            this.paths[type] = Factory.sceneModel({
                model: Sprite,
                name: this.name + '|path' + type,
                texture: {
                    path: TT_ROAD[type],
                    parentModel: this.cell,
                    rotate: ROTATE_ROAD.hasOwnProperty(type) ? ROTATE_ROAD[type] : null,
                },
            });
            Scene.addModelToContainer(this.paths[type], this);

            this.paths[type].colorizer = new Colorizer(this.paths[type]);
        }
    }

    setColor(color, fromDir) {
        if (color) {
            let pathType = SIDE_TO_ROAD_PATH[fromDir];
            if (this.canPathSetColor(pathType)) {
                this.setColorToPath(pathType, color);
                this.moveColorToNextPath(color, this.disabledDirsToMoveColor(fromDir));
            }
        }
        else {
            this.paths.map((path) => { path && path.colorizer.removeColor(); });
        }
    }

    disabledDirsToMoveColor(fromDir) {
        let disabled = [fromDir];
        if (ROAD_HEAVY != this.type) {
            if (fromDir == LEFT || fromDir == RIGHT) {
                disabled.push(UP);
                disabled.push(DOWN);
            }
            else {
                disabled.push(LEFT);
                disabled.push(RIGHT);
            }
        }
        return disabled;
    }

    moveColorToNextPath(color, disabledDirs) {
        setTimeout(() => {
            let nextCells = [];

            SIDES.map((side) => {
                if (disabledDirs.includes(side)) { return; }
                let pathType = SIDE_TO_ROAD_PATH[side];
                if (this.canPathSetColor(pathType)) {
                    this.setColorToPath(pathType, color);
                    nextCells.push(side);
                }
            });
            setTimeout(() => { this.setColorToPath(ROAD_PATH_HEAVY, color); }, this.cell.grid.coloringSpeedMs * 0.5);

            this.moveColorToNextCells(nextCells, color);

        }, this.cell.grid.coloringSpeedMs);
    }

    moveColorToNextCells(nextCells, color) {
        setTimeout(() => {
            nextCells.map((toDir) => {
                this.cell.execForNeighborsRoads('setColor', [color, OPPOSITE_SIDE[toDir]], [toDir])
            });
        }, this.cell.grid.coloringSpeedMs)
    }

    setColorToPath(pathType, color) {
        if (!this.paths[pathType]) { return; }
        if (color) { this.paths[pathType].colorizer.setColor(color); }
        else { this.paths[pathType].colorizer.removeColor() }
    }
    canPathSetColor(pathType) {
        if (!this.paths[pathType]) { return false; }
        return !this.paths[pathType].colorizer.isColorized;
    }

    removePath(type) {
        this.destroyChild('paths', type);
    }

    refreshPaths() {
        if (ROAD_HEAVY == this.type && this.countObjectsAround < 3) { this.type = ROAD_LIGHT; }

        if (this.isEmptyAround && !this.emptyMe) { return; }

        if (this.isEmptyAround || this.isEmptyUpDown ||
            (ROAD_HEAVY != this.type && this.countObjectsAround == 3 && (this.scheme.isCellEmpty(...this.cell.schemePositionUp) || this.scheme.isCellEmpty(...this.cell.schemePositionDown)))
        ) {
            this.drawPath(ROAD_PATH_LEFT);
            this.drawPath(ROAD_PATH_RIGHT);
            this.removePath(ROAD_PATH_UP);
            this.removePath(ROAD_PATH_DOWN);
        }
        else if (this.isEmptyLeftRight || (ROAD_HEAVY != this.type && this.countObjectsAround == 3)) {
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

        if (ROAD_HEAVY == this.type) {
            this.drawPath(ROAD_PATH_HEAVY);
        }
        else { this.removePath(ROAD_PATH_HEAVY); }
    }

    correctNeighborsRoads() { this.cell.execForNeighborsRoads('refreshPaths'); }

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