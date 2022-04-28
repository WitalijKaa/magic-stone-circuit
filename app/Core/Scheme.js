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

class Scheme {

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

    scheme = {};

    get ratio() {
        return Scene.deviceRation;
    }

    coloringSpeedMs = 200;

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
        this.extractCacheActions().map((cache) => {
            this[cache.method](...cache.params);
        })

        setTimeout(() => { this.updateTick() }, this.coloringSpeedMs);
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

    /** COLORs **/

    cacheColorings = {};

    setColorAround(colorType, x, y) {
        this.coloringCellCache(x, y).push({
            type: ST_ROAD,
            method: 'execSetColorAround',
            params: [colorType, x, y],
        });
    }

    execSetColorAround(colorType, x, y) {
        let color = null
        if (STONE_TYPE_TO_ROAD_COLOR.hasOwnProperty(colorType)) {
            color = STONE_TYPE_TO_ROAD_COLOR[colorType];
        }
        SIDES.map((sideTo) => {
            this.setColorToRoad(color, OPPOSITE_SIDE[sideTo], ...this[sideTo](x, y))
            this.setAwakeColorSemiconductorByStone(color, ...this[sideTo](x, y))
        });
    }

    coloringCellCache(x, y) {
        let name = this.cellName(x, y);
        if (!this.cacheColorings[name]) { this.cacheColorings[name] = []; }
        return this.cacheColorings[name];
    }

    removeColoringCellCache(x, y) {
        let name = this.cellName(x, y);
        if (this.cacheColorings[name]) { delete this.cacheColorings[name]; }
    }

    /** STONEs **/

    putContent(type, x, y) {
        this.changeCellContent(type, x, y);
        this.setColorAround(type, x, y);
        this.visibleUpdate(x, y);
    }

    /** ROADs **/

    putRoad(x, y) {
        this.changeCellRoad({
            type: ROAD_LIGHT,
            paths: [false, false, false, false, false],
        }, x, y);

        this.resetPathsOnRoad(x, y);
        this.visibleUpdate(x, y);
        this.doCheckRunForRoads(x, y)
    }

    removeRoad(x, y) {
        this.changeCellRoad(null, x, y);

        this.visibleUpdate(x, y);
        this.doCheckRunForRoads(x, y)
    }

    doCheckRunForRoads(x, y) {
        this.execCheckRunForRoads(null, x, y);
    }
    
    execCheckRunForRoads(checkRun, x, y) {
        if (!checkRun) {
            checkRun = this.constructor.checkRun;
            this.findRoadCellOrEmpty(x, y).road.checkRun = checkRun;
        }

        SIDES.map((side) => {
            let sideXY = []; sideXY.push(...this[side](x, y));
            let road = this.findRoadCellOrEmpty(...sideXY).road;

            if (road.type && checkRun != road.checkRun) {
                road.checkRun = checkRun;
                this.resetPathsOnRoad(...sideXY);
                this.visibleUpdate(...sideXY);
                this.execCheckRunForRoads(checkRun, ...sideXY);
                this.removeColoringCellCache(...sideXY)
            }
        });
    }

    resetPathsOnRoad(x, y) {
        let road = this.findCellOrEmpty(x, y).road;
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
        this.findCellOrEmpty(x, y).road.paths[pathType] = pathContent;
    }

    setColorToRoad(color, fromDir, x, y) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road) { return; }
        let pathType = SIDE_TO_ROAD_PATH[fromDir];

        if (color) {
            if (this.canPathSetColor(road, pathType)) {
                road.paths[pathType] = color;
                this.moveColorToNextPaths(
                    x, y,
                    color,
                    this.disabledDirsToMoveColor(road, this.countRoadsAround(x, y), fromDir)
                );
            }
        }
        else {
            if (road.paths[pathType]) {
                road.paths[pathType] = true;
            }
        }

        this.visibleUpdate(x, y);
    }

    canPathSetColor(road, pathType) { return true === road.paths[pathType]; }

    moveColorToNextPaths(x, y, color, disabledDirs) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road) { return; }

        this.coloringCellCache(x, y).push({
            type: ST_ROAD,
            method: 'execMoveColorToNextPaths',
            params: [x, y, color, disabledDirs],
        });
    }

    execMoveColorToNextPaths(x, y, color, disabledDirs) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road) { return; }

        let nextSides = [];

        SIDES.map((side) => {
            if (disabledDirs.includes(side)) { return; }
            let pathType = SIDE_TO_ROAD_PATH[side];
            if (this.canPathSetColor(road, pathType)) {
                road.paths[pathType] = color;
                nextSides.push(side);
            }
        });
        this.visibleUpdate(x, y);

        this.coloringCellCache(x, y).push({
            type: ST_ROAD,
            method: 'moveColorToHeavy',
            params: [road, color, x, y],
        });

        this.coloringCellCache(x, y).push({
            type: ST_ROAD,
            method: 'moveColorToNextCells',
            params: [x, y, nextSides, color],
        });
    }

    moveColorToHeavy(road, color, x, y) {
        if (this.canPathSetColor(road, ROAD_PATH_HEAVY)) {
            road.paths[ROAD_PATH_HEAVY] = color;
            this.visibleUpdate(x, y);
        }
    }

    moveColorToNextCells(x, y, nextSides, color) {
        nextSides.map((toDir) => {
            this.setColorToRoad(color, OPPOSITE_SIDE[toDir], ...this[toDir](x, y))
            this.setColorToSemiconductorByRoad(color, OPPOSITE_SIDE[toDir], ...this[toDir](x, y))
        });
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

    countObjectsAround(x, y) {
        let count = 0;
        if (!this.isCellEmpty(x + 1, y)) { count++; }
        if (!this.isCellEmpty(x - 1, y)) { count++; }
        if (!this.isCellEmpty(x, y + 1)) { count++; }
        if (!this.isCellEmpty(x, y - 1)) { count++; }
        return count;
    }

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

    /** SEMICONDUCTOR **/

    putSemiconductor(scType, x, y) {
        if (!scType) {
            this.changeCellSemiconductor(null, x, y);
        }
        else if (ST_ROAD_SLEEP == scType) {
            return this.putSleepSemiconductor(x, y);
        }
        else if (ST_ROAD_AWAKE == scType) {
            this.changeCellSemiconductor({ type: ST_ROAD_AWAKE, direction: ROAD_HEAVY }, x, y);
        }
        return false;
    }

    putSleepSemiconductor(x, y) {
        if (this.isSemiconductorTypeAround(ST_ROAD_SLEEP, x, y) ||
            1 < this.countSemiconductorTypeAround(ST_ROAD_AWAKE, x, y))
        {
            return false;
        }

        let direction;
        if (this.isSemiconductorTypeAround(ST_ROAD_AWAKE, x, y)) {
            if (this.isSemiconductorTypeLeftOrRight(ST_ROAD_AWAKE, x, y)) {
                direction = ROAD_LEFT_RIGHT;
            }
            else { direction = ROAD_UP_DOWN; }
        }
        else {
            if (ST_ROAD_SLEEP == this.findSemiconductorCellOrEmpty(x, y).semiconductor.type) {
                direction = (ROAD_LEFT_RIGHT == this.findSemiconductorCellOrEmpty(x, y).semiconductor.direction ? ROAD_UP_DOWN : ROAD_LEFT_RIGHT);
            }
            else {
                if (!this.isRoadsAround(x, y) || this.isRoadLeftOrRight(x, y)) {
                    direction = ROAD_LEFT_RIGHT;
                }
                else { direction = ROAD_UP_DOWN; }
            }
        }
        this.changeCellSemiconductor({ type: ST_ROAD_SLEEP, direction: direction }, x, y);
        return true;
    }

    isSemiconductorTypeAround(scType, x, y) { return !!this.countSemiconductorTypeAround(scType, x, y); }
    countSemiconductorTypeAround(scType, x, y) {
        let count = 0;
        if (scType == this.findSemiconductorCellOrEmpty(x + 1, y).semiconductor.type) { count++; }
        if (scType == this.findSemiconductorCellOrEmpty(x - 1, y).semiconductor.type) { count++; }
        if (scType == this.findSemiconductorCellOrEmpty(x, y + 1).semiconductor.type) { count++; }
        if (scType == this.findSemiconductorCellOrEmpty(x, y - 1).semiconductor.type) { count++; }
        return count;
    }

    setAwakeColorSemiconductorByStone(color, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi || ST_ROAD_AWAKE != semi.type || semi.colorAwake == color) { return; }
        semi.colorAwake = color;
        semi.color = color ? ROAD_TO_LIGHT_COLOR[color] : null;
        this.visibleUpdate(x, y);

        SIDES.map((toDir) => {
            this.setAwakeColorSemiconductorByStone(semi.colorAwake, ...this[toDir](x, y));
            this.setAwakeColorToSemiconductorByAwake(semi.colorAwake, ...this[toDir](x, y));
        });
    }

    setAwakeColorToSemiconductorByAwake(color, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi || ST_ROAD_SLEEP != semi.type || semi.colorAwake == color) { return; }

        semi.color = color ? ROAD_TO_LIGHT_COLOR[color] : null;
        semi.colorAwake = color;
        this.visibleUpdate(x, y);
    }

    setChargeColorToSemiconductorByAwake(color, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi || semi.colorCharge == color) { return; }

        if (ST_ROAD_AWAKE == semi.type) {
            if (semi.colorAwake != color) { return; }
        }
        else if (ST_ROAD_SLEEP != semi.type) { return; }

        semi.colorCharge = color;
        this.visibleUpdate(x, y);

        if (ST_ROAD_AWAKE == semi.type) {
            SIDES.map((toDir) => {
                this.setChargeColorToSemiconductorByAwake(color, ...this[toDir](x, y));
            });
        }
    }

    setColorToSemiconductorByRoad(color, fromDir, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi) { return; }
        if (ST_ROAD_AWAKE == semi.type) {
            this.setChargeColorToSemiconductorByAwake(color, x, y);
        }
        else if (ST_ROAD_SLEEP == semi.type) {
            if (semi.direction == ROAD_LEFT_RIGHT) {
                if (LEFT != fromDir && RIGHT != fromDir) { return; }
            }
            else if (UP != fromDir && DOWN != fromDir) { return; }

            this.setColorToSemiconductorBySleep(color, fromDir, x, y);
        }
    }

    setColorToSemiconductorBySleep(color, fromDir, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (semi) {
            if (ST_ROAD_SLEEP != semi.type && ST_ROAD_AWAKE != semi.type) { return; }
            if (semi.colorFlow == color || semi.colorCharge != color || semi.colorCharge != semi.colorAwake) { return; }
            semi.colorFlow = color;
            this.visibleUpdate(x, y);
            SIDES.map((toDir) => {
                let nextXY = []; nextXY.push(...this[toDir](x, y));
                this.coloringCellCache(...nextXY).push({
                    type: ST_ROAD_SLEEP,
                    method: 'setColorToSemiconductorBySleep',
                    params: [color, OPPOSITE_SIDE[toDir], ...nextXY],
                });
            });

            if (ST_ROAD_SLEEP == semi.type) {
                let sides = semi.direction == ROAD_LEFT_RIGHT ? SIDES_LEFT_RIGHT : SIDES_UP_DOWN;
                sides.map((toDir) => {
                    let nextXY = []; nextXY.push(...this[toDir](x, y));
                    this.coloringCellCache(...nextXY).push({
                        type: ST_ROAD,
                        method: 'setColorToRoad',
                        params: [color, OPPOSITE_SIDE[toDir], ...nextXY],
                    });
                });
            }
        }
    }

    isSemiconductorTypeLeftOrRight(scType, x, y) { return scType == this.findSemiconductorCellOrEmpty(x + 1, y).semiconductor.type || scType == this.findSemiconductorCellOrEmpty(x - 1, y).semiconductor.type; }
}
