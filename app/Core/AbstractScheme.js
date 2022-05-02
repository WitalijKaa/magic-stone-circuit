const ST_STONE_VIOLET = 1;
const ST_STONE_RED = 2;
const ST_STONE_INDIGO = 3;
const ST_STONE_ORANGE = 4;
const ST_ENERGY = 5;
const ST_ROAD = 6;
const ST_ROAD_SLEEP = 7;
const ST_ROAD_AWAKE = 8;

const CONTENT_SPRITES = {
    [ST_STONE_VIOLET]: TT.stoneV,
    [ST_STONE_RED]: TT.stoneR,
    [ST_STONE_INDIGO]: TT.stoneI,
    [ST_STONE_ORANGE]: TT.stoneO,
    //[ST_ENERGY]: TT.energy,
}
const SEMICONDUCTOR_SPRITES = {
    [ST_ROAD_SLEEP]: TT.roadSleep,
    [ST_ROAD_AWAKE]: TT.roadAwakening,
}
const SEMICONDUCTOR_SPRITES_CHARGE = {
    [ST_ROAD_SLEEP]: TT.roadSleepCharge,
    [ST_ROAD_AWAKE]: TT.roadAwakeningCharge,
}
const SEMICONDUCTOR_SPRITES_FLOW = {
    [ST_ROAD_SLEEP]: TT.roadSleepFlow,
    [ST_ROAD_AWAKE]: TT.roadAwakeningFlow,
}

const STONE_TYPE_TO_ROAD_COLOR = {
    [ST_STONE_VIOLET]: COLOR_VIOLET_ROAD,
    [ST_STONE_RED]: COLOR_RED_ROAD,
    [ST_STONE_INDIGO]: COLOR_INDIGO_ROAD,
    [ST_STONE_ORANGE]: COLOR_ORANGE_ROAD,
}

const ROAD_TO_LIGHT_COLOR = {
    [COLOR_VIOLET_ROAD]: COLOR_VIOLET_ROAD_LIGHT,
    [COLOR_RED_ROAD]: COLOR_RED_ROAD_LIGHT,
    [COLOR_INDIGO_ROAD]: COLOR_INDIGO_ROAD_LIGHT,
    [COLOR_ORANGE_ROAD]: COLOR_ORANGE_ROAD_LIGHT,
}

const BUILD_ROAD_WAY_HORZ_VERT = 1;
const BUILD_ROAD_WAY_VERT_HORZ = 2;
const BUILD_ROAD_WAY_STEPS_HORZ_VERT = 3;
const BUILD_ROAD_WAY_STEPS_VERT_HORZ = 4;

class AbstractScheme {

    static SIZE_RADIUS = 800000000;

    static schemes = {};

    static getNamedScheme(name) {
        if (!Scheme.schemes[name]) {
            Scheme.schemes[name] = new Scheme();
        }
        return Scheme.schemes[name];
    }

    static _checkRunIX = 1;
    static get checkRun() { return this._checkRunIX++; }

    static rnd(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    scheme = {};

    contentCells = {};
    contentUpdateTickCountdown = 10;

    get ratio() {
        return Scene.deviceRation;
    }

    coloringSpeedMs = 100;
    coloringSpeedCountdownNext = [3, 5];
    coloringAwaitTick = false;

    isRoadBuildMode = false;

    Up(x, y) { return [x, y - 1]; }
    Right(x, y) { return [x + 1, y]; }
    Down(x, y) { return [x, y + 1]; }
    Left(x, y) { return [x - 1, y]; }

    cellName (x, y) { return x + '|' + y; }

    visibleUpdate = () => {};
    injectVisibleUpdate(visibleCallback) {
        this.visibleUpdate = visibleCallback;
    }

    changeCellProperty(property, val, x, y) {
        if (val) {
            if (!this.scheme[x]) { this.scheme[x] = {}; }
            this.scheme[x][y] = { [property]: val };
        }
        else {
            if (this.scheme[x] && this.scheme[x][y]) {
                this.scheme[x][y][property] = null;
                this.isCellEmpty(x, y);
            }
        }
    }
    changeCellContent(type, x, y) { this.changeCellProperty('content', type, x, y); }
    changeCellRoad(obj, x, y) { this.changeCellProperty('road', obj, x, y); }
    changeCellSemiconductor(obj, x, y) { this.changeCellProperty('semiconductor', obj, x, y); }

    findCellOrEmpty(x, y) {
        if (this.scheme[x] && this.scheme[x][y]) { return this.scheme[x][y]; }
        return {};
    }
    findContentCellOrEmpty(x, y) {
        let cell = this.findCellOrEmpty(x, y);
        if (!cell.content) { return { content: {} }; }
        return cell
    }
    findRoadCellOrEmpty(x, y) {
        let cell = this.findCellOrEmpty(x, y);
        if (!cell.road) { return { road: {} }; }
        return cell
    }
    findSemiconductorCellOrEmpty(x, y) {
        let cell = this.findCellOrEmpty(x, y);
        if (!cell.semiconductor) { return { semiconductor: {} }; }
        return cell
    }

    isCellEmpty (x, y) {
        if (!this.scheme[x] || !this.scheme[x][y]) {
            return true;
        }
        for (const property in this.scheme[x][y]) {
            if (this.scheme[x][y][property]) { return false; }
        }
        this.scheme[x][y] = null;
        return true;
    }

    isEmptyUpDown(x, y) { return this.isCellEmpty(x, y + 1) && this.isCellEmpty(x, y - 1); }
    isEmptyLeftRight(x, y) { return this.isCellEmpty(x + 1, y) && this.isCellEmpty(x - 1, y); }

    setCellEmpty(x, y) {
        this.changeCellContent(null, x, y);
    }

    updateTick() {
        if (this.isRoadBuildMode) {
            this.buildRoadTick();
        }
        else {
            this.extractCacheActions().map((cache) => {
                this[cache.method](...cache.params);
            })
            this.updateTickContent();
        }
        setTimeout(() => { this.updateTick() }, this.coloringSpeedMs);
    }

    updateTickContent() {
        this.coloringAwaitTick = false;
        this.contentUpdateTickCountdown--;
        if (this.contentUpdateTickCountdown < 1) {
            this.contentUpdateTickCountdown = this.constructor.rnd(...this.coloringSpeedCountdownNext);
            this.coloringAwaitTick = true;

            for (let cellName in this.contentCells) {
                this.coloringCellCache(...this.contentCells[cellName]).push({
                    type: ST_STONE_VIOLET,
                    method: 'setColorAroundByStone',
                    params: [...this.contentCells[cellName]],
                    cacheDirections: [SIDES],
                });
            }
        }
    }

    extractCacheActions() {
        let cacheColorings = [];
        for (let cName in this.cacheColorings) {
            if (this.cacheColorings[cName] && this.cacheColorings[cName].length) {
                cacheColorings.push(...this.cacheColorings[cName].splice(0))
                delete(this.cacheColorings[cName]);
            }
        }
        return cacheColorings;
    }

    countObjectsAround(x, y) {
        let count = 0;
        if (!this.isCellEmpty(x + 1, y)) { count++; }
        if (!this.isCellEmpty(x - 1, y)) { count++; }
        if (!this.isCellEmpty(x, y + 1)) { count++; }
        if (!this.isCellEmpty(x, y - 1)) { count++; }
        return count;
    }

    /** abstract **/

    buildRoadTick() { }

    /** COLORs **/

    cacheColorings = {};

    coloringCellCache(x, y) {
        let name = this.cellName(x, y);
        if (!this.cacheColorings[name]) { this.cacheColorings[name] = []; }
        return this.cacheColorings[name];
    }

    removeColoringCellCache(x, y) {
        let name = this.cellName(x, y);
        if (this.cacheColorings[name]) { delete this.cacheColorings[name]; }
    }

    removeColoringCellCacheToDir(toDir, x, y) {
        let name = this.cellName(x, y);
        if (this.cacheColorings[name]) {
            for (let ix = this.cacheColorings[name].length - 1; ix >= 0; ix--) {
                let cache = this.cacheColorings[name][ix];
                if (cache.cacheDirections.includes((toDir))) {
                    this.cacheColorings[name].splice(ix, 1);
                }
            }
        }
    }

    /** ROADs **/

    isRoadsAround(x, y) { return !!this.countRoadsAround(x, y); }
    countRoadsAround(x, y) {
        let count = 0;
        if (this.findCellOrEmpty(x + 1, y).road) { count++; }
        if (this.findCellOrEmpty(x - 1, y).road) { count++; }
        if (this.findCellOrEmpty(x, y + 1).road) { count++; }
        if (this.findCellOrEmpty(x, y - 1).road) { count++; }
        return count;
    }

    isRoadLeftOrRight(x, y) { return this.findCellOrEmpty(x + 1, y).road || this.findCellOrEmpty(x - 1, y).road; }

    isRoadFlowColorToSide(color, toDir, x, y) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road) { return false; }
        let path = road.paths[SIDE_TO_ROAD_PATH[toDir]];
        return !!(path && true !== path && path.color == color && path.from == OPPOSITE_SIDE[toDir]);
    }

    isUncoloredRoadAtSide(side, x, y) {
        let road = this.findCellOrEmpty(...this[side](x, y)).road;
        return !!(road && true === road.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[side]]]);
    }

    isColoredRoadAtSide(side, x, y) {
        let road = this.findCellOrEmpty(...this[side](x, y)).road;
        return !!(road && road.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[side]]] && true !== road.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[side]]]);
    }

    isColoredRoadAtSideFlowsHere(side, x, y) {
        if (!this.isColoredRoadAtSide(side, x, y)) { return false; }
        return (this.findCellOrEmpty(...this[side](x, y)).road.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[side]]].from == side);
    }
    isColoredRoadAtSideFlowsOutHere(side, x, y) {
        if (!this.isColoredRoadAtSide(side, x, y)) { return false; }
        return (this.findCellOrEmpty(...this[side](x, y)).road.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[side]]].from == OPPOSITE_SIDE[side]);
    }

    isColoredRoadFlowsOutToDirection(toDir, x, y) {
        let road = this.findCellOrEmpty(x, y).road;
        let path = SIDE_TO_ROAD_PATH[toDir];
        return !!(road && road.paths[path] && true !== road.paths[path] && road.paths[path].from == OPPOSITE_SIDE[toDir]);
    }

    isAnyRoadAtSide(side, x, y) {
        let road = this.findCellOrEmpty(...this[side](x, y)).road;
        return !!(road && road.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[side]]]);
    }

    canSetRoad(x, y) {
        if (this.isCellEmpty(x, y)) { return true; }
        return !!this.findCellOrEmpty(x, y).road;
    }

    isAnyRoadHorizontal(x, y) {
        return !!(this.isAnyRoadAtSide(LEFT, x, y) || this.isAnyRoadAtSide(RIGHT, x, y));
    }
    isAnyRoadVertical(x, y) {
        return !!(this.isAnyRoadAtSide(UP, x, y) || this.isAnyRoadAtSide(DOWN, x, y));
    }

    canSetRoadByOrientation(isHorizontalOrientation, x, y) {
        if (!this.canSetRoad(x, y)) { return false; }
        if (!this.findCellOrEmpty(x, y).road) { return true; }
        if (isHorizontalOrientation) { return this.isAnyRoadHorizontal(x, y); }
        return this.isAnyRoadVertical(x, y);
    }
    canSetRoadByHorizontal(x, y) { return this.canSetRoadByOrientation(true, x, y); }
    canSetRoadByVertical(x, y) { return this.canSetRoadByOrientation(false, x, y); }

    getColorOfRoadBySide(side, x, y) {
        let road = this.findCellOrEmpty(...this[side](x, y)).road;
        if (!road || true == road.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[side]]]) { return; }
        return road.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[side]]].color;
    }

    canPathSetColor(road, pathType) { return true === road.paths[pathType]; }
    canPathCancelColor(road, pathType) { return !!(true !== road.paths[pathType] && road.paths[pathType]); }

    /** SEMICONDUCTOR **/

    isSemiconductorTypeAround(scType, x, y) { return !!this.countSemiconductorTypeAround(scType, x, y); }
    countSemiconductorTypeAround(scType, x, y) {
        let count = 0;
        if (scType == this.findSemiconductorCellOrEmpty(x + 1, y).semiconductor.type) { count++; }
        if (scType == this.findSemiconductorCellOrEmpty(x - 1, y).semiconductor.type) { count++; }
        if (scType == this.findSemiconductorCellOrEmpty(x, y + 1).semiconductor.type) { count++; }
        if (scType == this.findSemiconductorCellOrEmpty(x, y - 1).semiconductor.type) { count++; }
        return count;
    }

    getSidesBySemiconductorType(semi) {
        let sides = SIDES;
        if (ST_ROAD_SLEEP == semi.type) {
            sides = semi.direction == ROAD_LEFT_RIGHT ? SIDES_LEFT_RIGHT : SIDES_UP_DOWN;
        }
        return sides;
    }

    isSemiconductorTypeLeftOrRight(scType, x, y) { return scType == this.findSemiconductorCellOrEmpty(x + 1, y).semiconductor.type || scType == this.findSemiconductorCellOrEmpty(x - 1, y).semiconductor.type; }

}