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

    allowedAmountOfAwakesCluster = 2;

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
    changeCellRoad(obj, x, y) {
        if (obj) { obj.paths = [...ALL_PATHS_EMPTY]; }
        this.changeCellProperty('road', obj, x, y);
    }
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

    isPerpendicularRoadAtSide(side, x, y) {
        let road = this.findCellOrEmpty(...this[side](x, y)).road;
        if (!road) { return false; }
        if (LEFT == side || RIGHT == side) { return ROAD_UP_DOWN == road.type; }
        return ROAD_LEFT_RIGHT == road.type;
    }

    isCellConnectedButNotRoadAtSide(side, x, y) {
        if (!this.isCellEmpty(...this[side](x, y))) {
            let cell = this.findCellOrEmpty(...this.Up(x, y));
            if (cell.road) { return false; }
            if (cell.semiconductor && ROAD_HEAVY != cell.semiconductor.direction) {
                if (LEFT == side || RIGHT == side) {
                    if (cell.semiconductor.direction != ROAD_LEFT_RIGHT) { return false; }
                }
                else {
                    if (cell.semiconductor.direction != ROAD_UP_DOWN) { return false; }
                }
            }
            return true;
        }
        return false;
    }

    isCellForForcedConnectionUp(x, y) {
        if (!this.isCellEmpty(...this.Up(x, y))) {
            let road = this.findCellOrEmpty(...this.Up(x, y)).road;
            if (!road) { return this.isCellConnectedButNotRoadAtSide(UP, x, y); }
            return !!(ROAD_UP_DOWN == road.type || ROAD_HEAVY == road.type);
        }
        return false;
    }
    isCellForForcedConnectionDown(x, y) {
        if (!this.isCellEmpty(...this.Down(x, y))) {
            let road = this.findCellOrEmpty(...this.Down(x, y)).road;
            if (!road) { return this.isCellConnectedButNotRoadAtSide(DOWN, x, y); }
            return !!(ROAD_UP_DOWN == road.type || ROAD_HEAVY == road.type);
        }
        return false;
    }
    isCellForForcedConnectionLeft(x, y) {
        if (!this.isCellEmpty(...this.Left(x, y))) {
            let road = this.findCellOrEmpty(...this.Left(x, y)).road;
            if (!road) { return this.isCellConnectedButNotRoadAtSide(LEFT, x, y); }
            return !!(ROAD_LEFT_RIGHT == road.type || ROAD_HEAVY == road.type);
        }
        return false;
    }
    isCellForForcedConnectionRight(x, y) {
        if (!this.isCellEmpty(...this.Right(x, y))) {
            let road = this.findCellOrEmpty(...this.Right(x, y)).road;
            if (!road) { return this.isCellConnectedButNotRoadAtSide(RIGHT, x, y); }
            return !!(ROAD_LEFT_RIGHT == road.type || ROAD_HEAVY == road.type);
        }
        return false;
    }
    countRoadsAroundForcedForConnect(x, y) {
        let count = 0;
        if (this.isCellForForcedConnectionUp(x, y)) { count++; }
        if (this.isCellForForcedConnectionRight(x, y)) { count++; }
        if (this.isCellForForcedConnectionDown(x, y)) { count++; }
        if (this.isCellForForcedConnectionLeft(x, y)) { count++; }
        return count;
    }

    isForcedCorner(x, y) {
        if (this.isCellForForcedConnectionUp(x, y) && this.isCellForForcedConnectionRight(x, y) && !this.isCellForForcedConnectionDown(x, y) && !this.isCellForForcedConnectionLeft(x, y)) { return true; }
        if (this.isCellForForcedConnectionRight(x, y) && this.isCellForForcedConnectionDown(x, y) && !this.isCellForForcedConnectionLeft(x, y) && !this.isCellForForcedConnectionUp(x, y)) { return true; }
        if (this.isCellForForcedConnectionDown(x, y) && this.isCellForForcedConnectionLeft(x, y) && !this.isCellForForcedConnectionUp(x, y) && !this.isCellForForcedConnectionRight(x, y)) { return true; }
        if (this.isCellForForcedConnectionLeft(x, y) && this.isCellForForcedConnectionUp(x, y) && !this.isCellForForcedConnectionRight(x, y) && !this.isCellForForcedConnectionDown(x, y)) { return true; }
        return false;
    }

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
                let cell = this.findCellOrEmpty(...this.contentCells[cellName]);

                if (cell.content) {
                    this.coloringCellCache(...this.contentCells[cellName]).push({
                        type: ST_STONE_VIOLET,
                        method: 'setColorAroundByStone',
                        params: [...this.contentCells[cellName]],
                        cacheDirections: SIDES,
                    });
                }
                else if (cell.semiconductor && ST_ROAD_SLEEP == cell.semiconductor.type) {
                    this.coloringCellCache(...this.contentCells[cellName]).push({
                        type: ST_ROAD_SLEEP,
                        method: 'setColorAroundBySleep',
                        params: [false, ...this.contentCells[cellName]],
                        cacheDirections: ROAD_LEFT_RIGHT == cell.semiconductor.direction ? [LEFT, RIGHT] : [UP, DOWN],
                    });
                }
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

    countAnyObjectsAround(x, y) {
        let count = 0;
        if (!this.isCellEmpty(x + 1, y)) { count++; }
        if (!this.isCellEmpty(x - 1, y)) { count++; }
        if (!this.isCellEmpty(x, y + 1)) { count++; }
        if (!this.isCellEmpty(x, y - 1)) { count++; }
        return count;
    }

    countTheObjectsAround(param, x, y) {
        let count = 0;
        if (this.findCellOrEmpty(...this.Up(x, y))[param]) { count++; }
        if (this.findCellOrEmpty(...this.Right(x, y))[param]) { count++; }
        if (this.findCellOrEmpty(...this.Down(x, y))[param]) { count++; }
        if (this.findCellOrEmpty(...this.Left(x, y))[param]) { count++; }
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

    disabledDirsToMoveColor(road, countRoadsAround, fromDir) {
        let disabled = [fromDir];
        if (ROAD_HEAVY != road.type && countRoadsAround > 2) {
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

    /** ROADs **/

    isRoadsAround(x, y) { return !!this.countRoadsAround(x, y); }
    countRoadsAround(x, y) { return this.countTheObjectsAround('road', x, y); }

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

    canSetRoadAndIsPathsEmptyAtOrientation(isHorizontalOrientation, x, y) {
        if (this.isCellEmpty(x, y)) { return true; }
        if (!this.canSetRoad(x, y)) { return false; }
        let road = this.findCellOrEmpty(x, y).road;
        if (isHorizontalOrientation) { return (!road.paths[ROAD_PATH_LEFT] && !road.paths[ROAD_PATH_RIGHT]); }
        return (!road.paths[ROAD_PATH_UP] && !road.paths[ROAD_PATH_DOWN]);
    }
    isRoadPathsEmptyHorizontal(x, y) { return this.canSetRoadAndIsPathsEmptyAtOrientation(true, x, y); }
    isRoadPathsEmptyVertical(x, y) { return this.canSetRoadAndIsPathsEmptyAtOrientation(false, x, y); }

    isAnyCornerInPaths(paths) {
        return !!((paths[ROAD_PATH_UP] || paths[ROAD_PATH_DOWN]) && (paths[ROAD_PATH_LEFT] || paths[ROAD_PATH_RIGHT]));
    }

    getColorOfRoadBySide(side, x, y) {
        let road = this.findCellOrEmpty(...this[side](x, y)).road;
        if (!road || true == road.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[side]]]) { return; }
        return road.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[side]]].color;
    }

    canPathSetColor(road, pathType) { return true === road.paths[pathType]; }
    canPathCancelColor(road, pathType) { return !!(true !== road.paths[pathType] && road.paths[pathType]); }

    /** SEMICONDUCTOR **/

    isSemiconductorTypeAround(semiType, x, y) { return !!this.countSemiconductorTypeAround(semiType, x, y); }
    countSemiconductorTypeAround(semiType, x, y) {
        let count = 0;
        if (semiType == this.findSemiconductorCellOrEmpty(...this.Up(x, y)).semiconductor.type) { count++; }
        if (semiType == this.findSemiconductorCellOrEmpty(...this.Right(x, y)).semiconductor.type) { count++; }
        if (semiType == this.findSemiconductorCellOrEmpty(...this.Down(x, y)).semiconductor.type) { count++; }
        if (semiType == this.findSemiconductorCellOrEmpty(...this.Left(x, y)).semiconductor.type) { count++; }
        return count;
    }

    getSidesBySemiconductorType(semi) {
        let sides = SIDES;
        if (ST_ROAD_SLEEP == semi.type) {
            sides = semi.direction == ROAD_LEFT_RIGHT ? SIDES_LEFT_RIGHT : SIDES_UP_DOWN;
        }
        return sides;
    }

    isSemiconductorTypeLeftOrRight(semiType, x, y) {
        return semiType == this.findSemiconductorCellOrEmpty(...this.Left(x, y)).semiconductor.type ||
               semiType == this.findSemiconductorCellOrEmpty(...this.Right(x, y)).semiconductor.type;
    }

    countAwakeClusterAtSide(checkRun, side, x, y) {
        let nextXY = []; nextXY.push(...this[side](x, y));
        let semi = this.findCellOrEmpty(...nextXY).semiconductor;
        if (!semi || ST_ROAD_AWAKE != semi.type) { return 0; }

        if (!checkRun) { checkRun = this.constructor.checkRun; }
        if (semi.checkRun == checkRun) { return 0; }
        semi.checkRun = checkRun;

        let count = 1;
        SIDES.map((toDir) => {
            if (toDir == OPPOSITE_SIDE[side]) { return; }
            count += this.countAwakeClusterAtSide(checkRun, toDir, ...nextXY)
        })
        return count;
    }

    turnSleepSemiconductorHere(side, x, y) {
        let semi = this.findCellOrEmpty(...this[side](x, y)).semiconductor;
        if (!semi || ST_ROAD_SLEEP != semi.type) { return false; }
        if (LEFT == side || RIGHT == side) {
            if (semi.direction != ROAD_LEFT_RIGHT) {
                semi.direction = ROAD_LEFT_RIGHT;
                return true;
            }
        }
        else {
            if (semi.direction != ROAD_UP_DOWN) {
                semi.direction = ROAD_UP_DOWN;
                return true;
            }
        }
    }

    _devCell
    devCell(x, y) {
        this._devCell = [x, y];
    }
    devCellEcho() {
        let cell = this.findCellOrEmpty(...this._devCell);
        console.log(
            'devCellEcho',
            this._devCell,
            cell.road ? cell.road : (cell.content ? 'color_' + cell.content : (cell.semiconductor ? cell.semiconductor : cell))
        );
    }
}