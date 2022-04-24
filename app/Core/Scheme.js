const ST_STONE_VIOLET = 1;
const ST_STONE_RED = 2;
const ST_STONE_INDIGO = 3;
const ST_STONE_ORANGE = 4;
const ST_ENERGY = 5;
const ST_TRANS = 6;
const ST_TRANS_SLEEP = 7;
const ST_TRANS_AWAKE = 8;

const TT_SCHEME = {
    [ST_STONE_VIOLET]: TT.stoneV,
    [ST_STONE_RED]: TT.stoneR,
    [ST_STONE_INDIGO]: TT.stoneI,
    [ST_STONE_ORANGE]: TT.stoneO,
    [ST_ENERGY]: TT.energy,
}

const STONE_TYPE_TO_ROAD_COLOR = {
    [ST_STONE_VIOLET]: COLOR_VIOLET_ROAD,
    [ST_STONE_RED]: COLOR_RED_ROAD,
    [ST_STONE_INDIGO]: COLOR_INDIGO_ROAD,
    [ST_STONE_ORANGE]: COLOR_ORANGE_ROAD,
}

class Scheme {

    static SIZE_RADIUS = 800000000;

    static schemes = {};

    static getNamedScheme(name) {
        if (!Scheme.schemes[name]) {
            Scheme.schemes[name] = new Scheme();
        }
        return Scheme.schemes[name];
    }

    scheme = {};

    get ratio() {
        return Scene.deviceRation;
    }

    changeCellProperty(property, type, x, y) {
        if (type) {
            if (!this.scheme[x]) { this.scheme[x] = {}; }
            if (!this.scheme[x][y]) { this.scheme[x][y] = { [property]: type } }
            else { this.scheme[x][y][property] = type; }
        }
        else {
            if (this.scheme[x] && this.scheme[x][y]) {
                this.scheme[x][y][property] = null;
                this.isCellEmpty(x, y);
            }
        }
    }
    changeCellContent(type, x, y) { this.changeCellProperty('content', type, x, y); }
    changeCellRoad(type, x, y) { this.changeCellProperty('road', type, x, y); }

    getCell(x, y) {
        if (this.scheme[x] && this.scheme[x][y]) { return this.scheme[x][y]; }
        return {};
    }

    isCellEmpty (x, y) {
        if (!this.scheme[x] || !this.scheme[x][y]) {
            return true;
        }
        for (const property in this.scheme[x][y]) {
            if (property) { return false; }
        }
        this.scheme[x][y] = null;
        return true;
    }

    resetPathsOnRoad(x, y) {
        let road = this.getCell(x, y) ? this.getCell(x, y).road : false;
        if (!road) { return; }

        let countAround = this.countObjectsAround(x, y);
        let emptyAround = !countAround;
        let emptyPaths = !road.paths[ROAD_PATH_UP] && !road.paths[ROAD_PATH_RIGHT] && !road.paths[ROAD_PATH_DOWN] && !road.paths[ROAD_PATH_LEFT];

        if (ROAD_HEAVY == road.type && countAround < 3) { road.type = ROAD_LIGHT; }

        if (emptyAround && !emptyPaths) { return; }

        if (emptyAround || this.isEmptyUpDown(x, y) ||
            (ROAD_HEAVY != road.type && countAround == 3 && (this.isCellEmpty(x, y + 1) || this.isCellEmpty(x, y - 1)))
        ) {
            this.defineRoadPath(x, y, ROAD_PATH_LEFT, true)
            this.defineRoadPath(x, y, ROAD_PATH_RIGHT, true)
            this.defineRoadPath(x, y, ROAD_PATH_UP, false)
            this.defineRoadPath(x, y, ROAD_PATH_DOWN, false)
        }
        else if (this.isEmptyLeftRight(x, y) || (ROAD_HEAVY != road.type && countAround == 3)) {
            this.defineRoadPath(x, y, ROAD_PATH_LEFT, false)
            this.defineRoadPath(x, y, ROAD_PATH_RIGHT, false)
            this.defineRoadPath(x, y, ROAD_PATH_UP, true)
            this.defineRoadPath(x, y, ROAD_PATH_DOWN, true)
        }
        else {
            this.defineRoadPath(x, y, ROAD_PATH_UP, !this.isCellEmpty(x, y - 1));
            this.defineRoadPath(x, y, ROAD_PATH_RIGHT, !this.isCellEmpty(x + 1, y));
            this.defineRoadPath(x, y, ROAD_PATH_DOWN, !this.isCellEmpty(x, y + 1));
            this.defineRoadPath(x, y, ROAD_PATH_LEFT, !this.isCellEmpty(x - 1, y));
        }

        this.defineRoadPath(x, y, ROAD_PATH_HEAVY, ROAD_HEAVY == road.type);
    }

    resetPathsOnNeighborsRoads(x, y) {
        this.resetPathsOnRoad(x, y - 1);
        this.resetPathsOnRoad(x + 1, y);
        this.resetPathsOnRoad(x, y + 1);
        this.resetPathsOnRoad(x - 1, y);
    }

    defineRoadPath(x, y, pathType, pathContent) {
        this.getCell(x, y).road.paths[pathType] = pathContent;
    }

    setColorToRoad(color, fromDir, x, y) {
        console.log(fromDir, x, y)
        return;

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

    // isEmptyAround(x, y) { return !this.countObjectsAround(x, y); }
    isEmptyUpDown(x, y) { return this.isCellEmpty(x, y + 1) && this.isCellEmpty(x, y - 1); }
    isEmptyLeftRight(x, y) { return this.isCellEmpty(x + 1, y) && this.isCellEmpty(x - 1, y); }

    countObjectsAround(x, y) {
        let count = 0;
        if (!this.isCellEmpty(x + 1, y)) { count++; }
        if (!this.isCellEmpty(x - 1, y)) { count++; }
        if (!this.isCellEmpty(x, y + 1)) { count++; }
        if (!this.isCellEmpty(x, y - 1)) { count++; }
        return count;
    }
}
