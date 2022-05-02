class Scheme extends AbstractScheme {

    /** STONEs **/

    putContent(type, x, y) {
        let oldType = this.findContentCellOrEmpty(x, y).content;
        if (oldType != type) { this.cancelNeighborsColorPathForAnyRoadByPaths(ALL_PATHS_ARE, x, y); }
        this.contentCells[this.cellName(x, y)] = [x, y];
        this.changeCellContent(type, x, y);
        this.visibleUpdate(x, y);
        this.updatePathsOnNeighborsRoads(x, y);
        if (oldType != type) { this.cancelNeighborsColorPathForAnyRoadByPaths(ALL_PATHS_ARE, x, y); }

        SIDES.map((sideTo) => {
            this.setAwakeColorSemiconductorByStone(STONE_TYPE_TO_ROAD_COLOR[type], ...this[sideTo](x, y))
        });

        if (this.coloringAwaitTick) {
            this.coloringCellCache(x, y).push({
                type: ST_STONE_VIOLET,
                method: 'setColorAroundByStone',
                params: [x, y],
                cacheDirections: SIDES,
            });
        }
    }

    removeContent(x, y) {
        if (!this.findCellOrEmpty(x, y).content) { return; }
        this.cancelNeighborsColorPathForAnyRoadByPaths(ALL_PATHS_ARE, x, y);
        SIDES.map((sideTo) => {
            this.setAwakeColorSemiconductorByStone(null, ...this[sideTo](x, y))
        });
        delete(this.contentCells[this.cellName(x, y)]);
        this.setCellEmpty(x, y);
        this.updatePathsOnNeighborsRoads(x, y);
    }

    setColorAroundByStone(x, y) {
        let colorType = this.findCellOrEmpty(x, y).content;
        if (!colorType) { return; }

        SIDES.map((sideTo) => {
            this.setColorToRoad(STONE_TYPE_TO_ROAD_COLOR[colorType], OPPOSITE_SIDE[sideTo], ...this[sideTo](x, y))
        });
    }

    /** ROADs **/

    putRoad(x, y) {
        this.changeCellRoad({
            type: ROAD_LIGHT,
            paths: [false, false, false, false, false],
        }, x, y);

        this.removeColoringCellCache(x, y);
        this.resetPathsOnRoad(x, y);
        this.visibleUpdate(x, y);

        this.updatePathsOnNeighborsRoads(x, y);
        this.cancelNeighborsColorPathForAnyRoadByPaths(this.findCellOrEmpty(x, y).road.paths, x, y);
    }

    makeRoadHeavy(x, y) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road || ROAD_HEAVY == road.type || this.countObjectsAround(x, y) < 3) { return false; }

        road.type = ROAD_HEAVY;
        this.removeColoringCellCache(x, y);
        this.resetPathsOnRoad(x, y);
        this.visibleUpdate(x, y);
        this.cancelNeighborsColorPathForAnyRoadByPaths(this.findCellOrEmpty(x, y).road.paths, x, y);
        return true;
    }

    removeRoad(x, y) {
        this.cancelNeighborsColorPathForAnyRoadByPaths(this.findCellOrEmpty(x, y).road.paths, x, y);

        this.changeCellRoad(null, x, y);
        this.removeColoringCellCache(x, y);

        this.visibleUpdate(x, y);

        this.updatePathsOnNeighborsRoads(x, y);
    }

    doCheckRunForRoads(checkRun, x, y) {
        if (!checkRun) {
            checkRun = this.constructor.checkRun;
            this.findRoadCellOrEmpty(x, y).road.checkRun = checkRun;
        }

        SIDES.map((toDir) => {
            let sideXY = []; sideXY.push(...this[toDir](x, y));
            let road = this.findCellOrEmpty(...sideXY).road;

            if (road && checkRun != road.checkRun) {
                road.checkRun = checkRun;
                this.updatePathsOnRoad(...sideXY);
                this.visibleUpdate(...sideXY);
                this.doCheckRunForRoads(checkRun, ...sideXY);
                this.removeColoringCellCache(...sideXY)
            }
        });
    }

    cancelColorOnRoadCell(checkRun, fromDir, x, y) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road) { return; }

        if (!checkRun) {
            checkRun = this.constructor.checkRun;
        }
        else if (checkRun == road.checkRun) { return; }
        road.checkRun = checkRun;

        let toDir = OPPOSITE_SIDE[fromDir];
        let fromPath = SIDE_TO_ROAD_PATH[fromDir];
        let oppositePath = SIDE_TO_ROAD_PATH[toDir];

        if (road.paths[fromPath]) {
            if (this.canPathCancelColor(road, fromPath)) {
                road.paths[fromPath] = true;
            }
            this.removeColoringCellCacheToDir(toDir, x, y);
            this.removeColoringCellCacheToDir(fromDir, x, y);
        }

        if (road.paths[oppositePath]) {
            if (this.canPathCancelColor(road, oppositePath)) {
                if (this.isColoredRoadFlowsOutToDirection(toDir, x, y)) {
                    this.setColorToSemiconductorByRoad(null, fromDir, ...this[toDir](x, y));
                }
                road.paths[oppositePath] = true;
            }
            this.removeColoringCellCacheToDir(toDir, x, y);
            this.removeColoringCellCacheToDir(fromDir, x, y);
            this.cancelColorOnRoadCell(checkRun, fromDir, ...this[toDir](x, y));
        }

        if (this.canPathCancelColor(road, ROAD_PATH_HEAVY)) {
            road.paths[ROAD_PATH_HEAVY] = true;
        }

        if (road.paths[fromPath] && (!road.paths[oppositePath] || road.paths[ROAD_PATH_HEAVY]))
        {
            SIDES_TURN_90[fromDir].map((turnSide) => {
                let turnPath = SIDE_TO_ROAD_PATH[turnSide];
                if (this.canPathCancelColor(road, turnPath)) {
                    if (this.isColoredRoadFlowsOutToDirection(turnSide, x, y)) {
                        this.setColorToSemiconductorByRoad(null, OPPOSITE_SIDE[turnSide], ...this[turnSide](x, y));
                    }
                    road.paths[turnPath] = true;
                }
                if (road.paths[turnPath]) {
                    this.removeColoringCellCacheToDir(turnPath, x, y);
                    this.removeColoringCellCacheToDir(OPPOSITE_SIDE[turnSide], x, y);
                    this.cancelColorOnRoadCell(checkRun, OPPOSITE_SIDE[turnSide], ...this[turnSide](x, y))
                }
            })
        }

        this.visibleUpdate(x, y);
    }

    resetPathsOnRoad(x, y) { this.setPathsOnRoadByScheme(false, x, y) }
    updatePathsOnRoad(x, y) { this.setPathsOnRoadByScheme(true, x, y) }

    setPathsOnRoadByScheme(updateMode, x, y) {
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
            this.defineRoadPath(x, y, ROAD_PATH_LEFT, true, updateMode)
            this.defineRoadPath(x, y, ROAD_PATH_RIGHT, true, updateMode)
            this.defineRoadPath(x, y, ROAD_PATH_UP, false, updateMode)
            this.defineRoadPath(x, y, ROAD_PATH_DOWN, false, updateMode)
        }
        else if (this.isEmptyLeftRight(x, y) || (ROAD_HEAVY != road.type && countAround == 3)) {
            this.defineRoadPath(x, y, ROAD_PATH_LEFT, false, updateMode)
            this.defineRoadPath(x, y, ROAD_PATH_RIGHT, false, updateMode)
            this.defineRoadPath(x, y, ROAD_PATH_UP, true, updateMode)
            this.defineRoadPath(x, y, ROAD_PATH_DOWN, true, updateMode)
        }
        else {
            this.defineRoadPath(x, y, ROAD_PATH_UP, !this.isCellEmpty(...this.Up(x, y)), updateMode);
            this.defineRoadPath(x, y, ROAD_PATH_RIGHT, !this.isCellEmpty(...this.Right(x, y)), updateMode);
            this.defineRoadPath(x, y, ROAD_PATH_DOWN, !this.isCellEmpty(...this.Down(x, y)), updateMode);
            this.defineRoadPath(x, y, ROAD_PATH_LEFT, !this.isCellEmpty(...this.Left(x, y)), updateMode);
        }

        this.defineRoadPath(x, y, ROAD_PATH_HEAVY, ROAD_HEAVY == road.type, updateMode);
    }

    updatePathsOnNeighborsRoads(x, y) {
        SIDES.map((toDir) => {
            this.updatePathsOnRoad(...this[toDir](x, y));
            this.visibleUpdate(...this[toDir](x, y));
        });
    }

    cancelNeighborsColorPathForAnyRoadByPaths(roadPaths, x, y) {
        SIDES.map((toDir) => {
            if (roadPaths[SIDE_TO_ROAD_PATH[toDir]]) {
                this.cancelColorAnyRoadPathByDir(toDir, x, y);
            }
        });
    }

    cancelColorAnyRoadPathByDir(toDir, x, y) { this.cancelColorPathBySideByParams(false, false, false, false, toDir, x, y); }
    cancelColorUncoloredRoadPathByDir(toDir, x, y) { this.cancelColorPathBySideByParams(false, false, false, true, toDir, x, y); }
    cancelColorColoredRoadPathByDir(toDir, x, y) { this.cancelColorPathBySideByParams(false, false, true, false, toDir, x, y); }
    cancelColorFlowsInRoadPathByDir(toDir, x, y) { this.cancelColorPathBySideByParams(true, false, true, false, toDir, x, y); }
    cancelColorFlowsOutRoadPathByDir(toDir, x, y) { this.cancelColorPathBySideByParams(false, true, true, false, toDir, x, y); }

    cancelColorPathBySideByParams(hasToFlowIn, hasToFlowOut, hasToBeColored, hasToBeUncolored, side, x, y) {
        if (!this.isAnyRoadAtSide(side, x, y)) { return;}

        if (hasToFlowIn || hasToFlowOut) { hasToBeColored = true; }
        if (hasToBeColored && hasToBeUncolored) { hasToBeColored = false; hasToBeUncolored = false; hasToFlowIn = false; hasToFlowOut = false; }

        if (hasToBeColored && !this.isColoredRoadAtSide(side, x, y)) { return; }
        if (hasToBeUncolored && !this.isUncoloredRoadAtSide(side, x, y)) { return; }
        if (hasToFlowIn && !this.isColoredRoadAtSideFlowsHere(side, x, y)) { return; }
        if (hasToFlowOut && !this.isColoredRoadAtSideFlowsOutHere(side, x, y)) { return; }

        this.cancelColorOnRoadCell(null, OPPOSITE_SIDE[side], ...this[side](x, y));
    }

    defineRoadPath(x, y, pathType, pathContent, updateMode = false) {
        if (!updateMode || !pathContent) {
            this.findCellOrEmpty(x, y).road.paths[pathType] = pathContent;
            this.cancelColorOnDefineRoadPath(x, y, pathType);
        }
        else if (!this.findCellOrEmpty(x, y).road.paths[pathType]) {
            this.findCellOrEmpty(x, y).road.paths[pathType] = pathContent;
            this.cancelColorOnDefineRoadPath(x, y, pathType);
        }
    }

    cancelColorOnDefineRoadPath(x, y, pathType) {
        if (ROAD_PATH_TO_SIDE.hasOwnProperty(pathType)) {
            let toDir = ROAD_PATH_TO_SIDE[pathType];
            let toDirRoad = this.findCellOrEmpty(...this[toDir](x, y)).road;
            if (toDirRoad && toDirRoad.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[toDir]]]) {
                this.cancelColorOnRoadCell(null, OPPOSITE_SIDE[toDir], ...this[toDir](x, y));
            }
        }
    }

    setColorToRoad(color, fromDir, x, y) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road) { return; }
        let pathFrom = SIDE_TO_ROAD_PATH[fromDir];

        if (color) {
            if (this.canPathSetColor(road, pathFrom)) {
                road.paths[pathFrom] = { color: color, from: fromDir };
                this.moveColorToNextPaths(
                    x, y,
                    color,
                    this.disabledDirsToMoveColor(road, this.countRoadsAround(x, y), fromDir)
                );
            }
        }
        else {
            if (road.paths[pathFrom]) {
                road.paths[pathFrom] = true;
            }
        }

        this.visibleUpdate(x, y);
    }

    moveColorToNextPaths(x, y, color, disabledDirs) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road) { return; }

        let cacheDirections = [];
        SIDES.map((side) => {
            if (disabledDirs.includes(side)) { return; }
            cacheDirections.push(side);
        });

        this.coloringCellCache(x, y).push({
            type: ST_ROAD,
            method: 'execMoveColorToNextPaths',
            params: [x, y, color, disabledDirs],
            cacheDirections: cacheDirections,
        });
    }

    execMoveColorToNextPaths(x, y, color, disabledDirs) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road) { return; }

        let nextSides = [];

        SIDES.map((toDir) => {
            if (disabledDirs.includes(toDir)) { return; }
            let pathTo = SIDE_TO_ROAD_PATH[toDir];
            if (this.canPathSetColor(road, pathTo)) {
                road.paths[pathTo] = { color: color, from: OPPOSITE_SIDE[toDir] };
                nextSides.push(toDir);
            }
        });
        this.visibleUpdate(x, y);

        this.coloringCellCache(x, y).push({
            type: ST_ROAD,
            method: 'moveColorToHeavy',
            params: [road, color, x, y],
            cacheDirections: SIDES,
        });

        this.coloringCellCache(x, y).push({
            type: ST_ROAD,
            method: 'moveColorToNextCells',
            params: [x, y, nextSides, color],
            cacheDirections: nextSides,
        });
    }

    moveColorToHeavy(road, color, x, y) {
        if (this.canPathSetColor(road, ROAD_PATH_HEAVY)) {
            road.paths[ROAD_PATH_HEAVY] = { color: color };
            this.visibleUpdate(x, y);
        }
    }

    moveColorToNextCells(x, y, nextSides, color) {
        nextSides.map((toDir) => {
            this.setColorToRoad(color, OPPOSITE_SIDE[toDir], ...this[toDir](x, y));
            this.setColorToSemiconductorByRoad(color, OPPOSITE_SIDE[toDir], ...this[toDir](x, y));
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

    /** ROADs BUILD **/

    buildingRoad = { start: [], end: [], path: [], way: {} };

    startToBuildRoad(x, y) {
        this.isRoadBuildMode = true;
        this.buildingRoad.start = [x, y];
        this.buildingRoad.painted = [x, y];
        this.buildingRoad.end = [x, y];
        this.buildingRoad.path = [];
    }

    continueToBuildRoad(x, y) {
        this.buildingRoad.end = [x, y];
    }

    finishToBuildRoad(x, y) {
        this.buildingRoad.end = [x, y];
        this.isRoadBuildMode = false;
    }

    buildRoadTick() {
        if (this.buildingRoad.painted[0] != this.buildingRoad.end[0] || this.buildingRoad.painted[1] != this.buildingRoad.end[1]) {
            this.removePrevBuiltRoad();
            this.findWayToBuildRoad();
            if (this.isWayPossible(this.buildingRoad.way.auto)) {
                this.doBuildRoad();
            }

            this.buildingRoad.painted[0] = this.buildingRoad.end[0];
            this.buildingRoad.painted[1] = this.buildingRoad.end[1];
        }
    }

    removePrevBuiltRoad() {
        this.buildingRoad.path.map((roadCellMem) => {
            if (true === roadCellMem.remove) {
                this.removeRoad(...roadCellMem.position);
            }
        })
        this.buildingRoad.path = [];
    }

    doBuildRoad() {
        let theWay = this.buildingRoad.way.auto;

        let xCell = this.buildingRoad.start[0];
        let yCell = this.buildingRoad.start[1];
        let xStep = this.buildingRoad.end[0] > this.buildingRoad.start[0] ? 1 : -1;
        let yStep = this.buildingRoad.end[1] > this.buildingRoad.start[1] ? 1 : -1;

        if (!this.findCellOrEmpty(...this.buildingRoad.start).road) {
            this.putRoad(...this.buildingRoad.start)
            this.buildingRoad.path.push({ remove: true, position: [...this.buildingRoad.start]});
        }

        if (BUILD_ROAD_WAY_HORZ_VERT == theWay) {
            while (xCell != this.buildingRoad.end[0]) {
                xCell += xStep;
                if (!this.findCellOrEmpty(xCell, yCell).road) {
                    this.putRoad(xCell, yCell)
                    this.buildingRoad.path.push({ remove: true, position: [xCell, yCell]});
                }
            }
            while (yCell != this.buildingRoad.end[1]) {
                yCell += yStep;
                if (!this.findCellOrEmpty(xCell, yCell).road) {
                    this.putRoad(xCell, yCell)
                    this.buildingRoad.path.push({ remove: true, position: [xCell, yCell]});
                }
            }
        }
        else if (BUILD_ROAD_WAY_VERT_HORZ == theWay) {
            while (yCell != this.buildingRoad.end[1]) {
                yCell += yStep;
                if (!this.findCellOrEmpty(xCell, yCell).road) {
                    this.putRoad(xCell, yCell)
                    this.buildingRoad.path.push({ remove: true, position: [xCell, yCell]});
                }
            }
            while (xCell != this.buildingRoad.end[0]) {
                xCell += xStep;
                if (!this.findCellOrEmpty(xCell, yCell).road) {
                    this.putRoad(xCell, yCell)
                    this.buildingRoad.path.push({ remove: true, position: [xCell, yCell]});
                }
            }
        }
    }

    findWayToBuildRoad() {
        this.buildingRoad.way = { auto: BUILD_ROAD_WAY_HORZ_VERT, fixed: null };

        let xCell = this.buildingRoad.start[0];
        let yCell = this.buildingRoad.start[1];
        let xStep = this.buildingRoad.end[0] > this.buildingRoad.start[0] ? 1 : -1;
        let yStep = this.buildingRoad.end[1] > this.buildingRoad.start[1] ? 1 : -1;
        let isFirstHorizontal = this.buildingRoad.end[0] != this.buildingRoad.start[0];

        let theWay = BUILD_ROAD_WAY_HORZ_VERT;
        while (theWay && xCell != this.buildingRoad.end[0]) {
            xCell += xStep;
            if (!this.canSetRoadByHorizontal(xCell, yCell)) {
                theWay = false;
            }
        }
        if (isFirstHorizontal && yCell != this.buildingRoad.end[1] && !this.canSetRoadByVertical(xCell, yCell)) {
            theWay = false; // corner check
        }
        while (theWay && yCell != this.buildingRoad.end[1]) {
            yCell += yStep;
            if (!this.canSetRoadByVertical(xCell, yCell)) {
                theWay = false;
            }
        }

        if (theWay) { this.buildingRoad.way.auto = theWay; return; }

        xCell = this.buildingRoad.start[0];
        yCell = this.buildingRoad.start[1];

        if (this.buildingRoad.end[0] != this.buildingRoad.start[0] && this.buildingRoad.end[1] != this.buildingRoad.start[1])
        {
            theWay = BUILD_ROAD_WAY_VERT_HORZ;
            while (theWay && yCell != this.buildingRoad.end[1]) {
                yCell += yStep;
                if (!this.canSetRoadByVertical(xCell, yCell)) {
                    theWay = false;
                }
            }
            if (!this.canSetRoadByHorizontal(xCell, yCell)) {
                theWay = false; // corner check
            }
            while (theWay && xCell != this.buildingRoad.end[0]) {
                xCell += xStep;
                if (!this.canSetRoadByHorizontal(xCell, yCell)) {
                    theWay = false;
                }
            }
        }

        if (theWay) { this.buildingRoad.way.auto = theWay; }
    }

    isWayPossible(theWay) {
        let xCell = this.buildingRoad.start[0];
        let yCell = this.buildingRoad.start[1];
        if (!this.canSetRoad(xCell, yCell)) { return false; }

        let xStep = this.buildingRoad.end[0] > this.buildingRoad.start[0] ? 1 : -1;
        let yStep = this.buildingRoad.end[1] > this.buildingRoad.start[1] ? 1 : -1;

        if (BUILD_ROAD_WAY_HORZ_VERT == theWay) {
            while (xCell != this.buildingRoad.end[0]) {
                xCell += xStep;
                if (!this.canSetRoad(xCell, yCell)) { return false; }
            }
            while (yCell != this.buildingRoad.end[1]) {
                yCell += yStep;
                if (!this.canSetRoad(xCell, yCell)) { return false; }
            }
        }
        else if (BUILD_ROAD_WAY_VERT_HORZ == theWay) {
            while (yCell != this.buildingRoad.end[1]) {
                yCell += yStep;
                if (!this.canSetRoad(xCell, yCell)) { return false; }
            }
            while (xCell != this.buildingRoad.end[0]) {
                xCell += xStep;
                if (!this.canSetRoad(xCell, yCell)) { return false; }
            }
        }
        return true;
    }

    /** SEMICONDUCTORs **/

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

    setAwakeColorSemiconductorByStone(color, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi || semi.colorAwake == color) { return; }

        semi.colorAwake = color;
        if (!color || semi.colorCharge != semi.colorAwake) {
            if (semi.colorFlow) {
                this.getSidesBySemiconductorType(semi).map((toDir) => {
                    this.cancelColorFlowsOutRoadPathByDir(toDir, x, y);
                });
            }
            semi.colorCharge = null;
            semi.colorFlow = null;
        }
        this.refreshSemiconductorByColoredRoadsFlowsIn(semi, x, y);
        this.visibleUpdate(x, y);
        this.removeColoringCellCache(x, y);

        if (ST_ROAD_AWAKE == semi.type) {
            SIDES.map((toDir) => {
                this.setAwakeColorSemiconductorByStone(semi.colorAwake, ...this[toDir](x, y));
            });
        }
    }

    refreshSemiconductorByColoredRoadsFlowsIn(semi, x, y) {
        this.getSidesBySemiconductorType(semi).map((side) => {
            if (this.isColoredRoadAtSideFlowsHere(side, x, y)) {
                if (ST_ROAD_AWAKE == semi.type) {
                    setTimeout(() => {
                        let color = this.getColorOfRoadBySide(side, x, y);
                        this.setColorToSemiconductorByRoad(color, side, x, y);
                    }, NANO_MS);
                }
                else if(ST_ROAD_SLEEP == semi.type) {
                    setTimeout(() => {
                        let color = this.getColorOfRoadBySide(side, x, y);
                        this.coloringCellCache(x, y).push({
                            type: ST_ROAD_SLEEP,
                            method: 'setColorToSemiconductorByRoad',
                            params: [color, side, x, y],
                            cacheDirections: [side],
                        });
                    }, NANO_MS * 10);

                }
            }
        });
    }

    setChargeColorToSemiconductorByAwake(color, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi || semi.colorCharge == color || (color && semi.colorAwake != color)) { return; }

        semi.colorCharge = color;
        if (!color) {
            if (ST_ROAD_SLEEP == semi.type && semi.colorFlow) {
                this.getSidesBySemiconductorType(semi).map((toDir) => {
                    this.cancelColorFlowsOutRoadPathByDir(toDir, x, y);
                });
            }
            semi.colorFlow = null;
        }
        this.refreshSemiconductorByColoredRoadsFlowsIn(semi, x, y);
        this.visibleUpdate(x, y);
        this.removeColoringCellCache(x, y);

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
            if (!color && this.hasTransistorTheSources(x, y)) { return; }
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

    hasTransistorTheSources(x, y, checkRun = null) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi || ST_ROAD_AWAKE != semi.type || !semi.colorCharge) { return false; }

        let exceptThisOne = false;
        if (!checkRun) {
            checkRun = this.constructor.checkRun;
            exceptThisOne = true;
        }
        if (semi.checkRun == checkRun) { return false; }
        semi.checkRun = checkRun;

        if (!exceptThisOne) {
            for (let ix = 0; ix < SIDES.length; ix++) {
                let fromDir = SIDES[ix];

                if (this.isRoadFlowColorToSide(semi.colorCharge, OPPOSITE_SIDE[fromDir], ...this[fromDir](x, y))) {
                    return true;
                }
            }
        }
        for (let ix = 0; ix < SIDES.length; ix++) {
            let nextXY = this[SIDES[ix]](x, y);
            if (this.hasTransistorTheSources(nextXY[0], nextXY[1], checkRun)) {
                return true;
            }
        }
    }

    setColorToSemiconductorBySleep(color, fromDir, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi) { return; }

        if (ST_ROAD_SLEEP != semi.type && ST_ROAD_AWAKE != semi.type) { return; }
        if (!semi.colorCharge || semi.colorFlow == color || semi.colorCharge != semi.colorAwake) { return; }

        semi.colorFlow = color;
        this.visibleUpdate(x, y);

        if (!color) {
            this.removeColoringCellCache(x, y);
        }

        SIDES.map((toDir) => {
            let nextXY = []; nextXY.push(...this[toDir](x, y));
            if (color) {
                this.coloringCellCache(...nextXY).push({
                    type: ST_ROAD_SLEEP,
                    method: 'setColorToSemiconductorBySleep',
                    params: [color, OPPOSITE_SIDE[toDir], ...nextXY],
                    cacheDirections: [toDir],
                });
            }
            else {
                this.setColorToSemiconductorBySleep(color, OPPOSITE_SIDE[toDir], ...nextXY);
            }
        });

        if (ST_ROAD_SLEEP == semi.type) {
            let sides = semi.direction == ROAD_LEFT_RIGHT ? SIDES_LEFT_RIGHT : SIDES_UP_DOWN;
            sides.map((toDir) => {
                let nextXY = []; nextXY.push(...this[toDir](x, y));

                if (color) {
                    if (this.isUncoloredRoadAtSide(toDir, x, y)) {
                        this.coloringCellCache(...nextXY).push({
                            type: ST_ROAD,
                            method: 'setColorToRoad',
                            params: [color, OPPOSITE_SIDE[toDir], ...nextXY],
                            cacheDirections: [toDir],
                        });
                    }
                }
                else {
                    if (this.isAnyRoadAtSide(toDir, x, y)) {
                        this.cancelColorOnRoadCell(null, OPPOSITE_SIDE[toDir], ...nextXY);
                    }
                }
            });
        }
    }

}
