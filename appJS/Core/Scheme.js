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

        this.afterChange();
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

        this.afterChange();
    }

    setColorAroundByStone(x, y) {
        let colorType = this.findCellOrEmpty(x, y).content;
        if (!colorType) { return; }

        SIDES.map((sideTo) => {
            this.setColorToRoad(STONE_TYPE_TO_ROAD_COLOR[colorType], OPPOSITE_SIDE[sideTo], ...this[sideTo](x, y))
        });
    }

    /** ROADs **/
    
    tapRoad(x, y) {
        if (this.isRoadBuildMode) { return; }

        if (false === this.setPathsOnRoadByTap(x, y)) {
            this.removeRoad(x, y);
        }
        this.removeColoringCellCache(x, y);
        this.afterChange();
    }

    putRoadHorizontal(x, y) {
        let preferType = ROAD_LEFT_RIGHT;
        let road = this.findCellOrEmpty(x, y).road;
        if (road) {
            let mergedZones = this.mergeZones([LEFT, RIGHT], x, y);
            if (ROAD_HEAVY == road.type || mergedZones.length == 3) {
                preferType = ROAD_HEAVY;
            }
        }

        return this.setPathsOnRoad(false, LEFT, RIGHT, preferType, x, y);
    }

    putRoadZonal(zoneFrom, zoneTo, x, y) {
        let preferType = ROAD_LIGHT;
        let road = this.findCellOrEmpty(x, y).road;
        if (road) {
            let mergedZones = this.mergeZones([zoneFrom, zoneTo], x, y);
            if (ROAD_HEAVY == road.type || mergedZones.length > 2) {
                preferType = ROAD_HEAVY;
            }
        }

        return this.setPathsOnRoad(false, zoneFrom, zoneTo, preferType, x, y);
    }

    putRoadVertical(x, y) {
        let preferType = ROAD_UP_DOWN;
        let road = this.findCellOrEmpty(x, y).road;
        if (road) {
            let mergedZones = this.mergeZones([UP, DOWN], x, y);
            if (ROAD_HEAVY == road.type || mergedZones.length == 3) {
                preferType = ROAD_HEAVY;
            }
        }

        return this.setPathsOnRoad(false, UP, DOWN, preferType, x, y);
    }

    afterPutRoad(x, y) {
        this.removeColoringCellCache(x, y);
        this.cancelNeighborsColorPathForAnyRoadByPaths(this.findCellOrEmpty(x, y).road.paths, x, y);
    }

    removeRoad(x, y) {
        if (!this.findCellOrEmpty(x, y).road) { return; }

        this.cancelNeighborsColorPathForAnyRoadByPaths(ALL_PATHS_ARE, x, y);

        this.changeCellRoad(null, x, y);
        this.removeColoringCellCache(x, y);
        this.visibleUpdate(x, y);
        this.afterChange();
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
                this.visibleUpdate(...sideXY);
                this.doCheckRunForRoads(checkRun, ...sideXY);
                this.removeColoringCellCache(...sideXY)
            }
        });
    }

    /** PATHs of road **/

    setPathsOnRoadByArr(updatePathsMode, replaceZonesMode, zones, preferType, x, y) {
        let change = { prev: null, curr: null };
        if (zones.length < 2 && replaceZonesMode) { return change; }

        let road = this.findCellOrEmpty(x, y).road;
        if (!road && !this.isCellEmpty(x, y)) { return change; }

        let mergedZones = (replaceZonesMode || !road) ? [...zones] : this.mergeZones(zones, x, y);

        if (!preferType ||
            (ROAD_LEFT_RIGHT == preferType && (!zones.includes(LEFT) || !zones.includes(RIGHT))) ||
            (ROAD_UP_DOWN == preferType && (!zones.includes(UP) || !zones.includes(DOWN))) ||
            (ROAD_HEAVY == preferType && 2 >= mergedZones.length))
        {
            preferType = ROAD_LIGHT;
        }

        if (mergedZones.length == 3) { preferType = ROAD_HEAVY; }
        if (ROAD_HEAVY != preferType && mergedZones.length == 4) { preferType = ROAD_LIGHT; }

        if (this.isCellEmpty(x, y)) {
            change = { prev: null, curr: preferType };
            this.changeCellRoad({ type: preferType }, x, y);
            road = this.findCellOrEmpty(x, y).road;
        }
        else {
            if (road.type == preferType && this.arePathsTheSame(road.paths, this.zonesToRoadPaths(mergedZones, preferType == ROAD_HEAVY))) {
                return change;
            }
            change = { prev: road.type, prevPaths: [...road.paths.map((path) => { return !!path; })], curr: preferType };
        }

        road.type = preferType;
        this.defineRoadPath(x, y, ROAD_PATH_LEFT, mergedZones.includes(LEFT), updatePathsMode);
        this.defineRoadPath(x, y, ROAD_PATH_RIGHT, mergedZones.includes(RIGHT), updatePathsMode);
        this.defineRoadPath(x, y, ROAD_PATH_UP, mergedZones.includes(UP), updatePathsMode);
        this.defineRoadPath(x, y, ROAD_PATH_DOWN, mergedZones.includes(DOWN), updatePathsMode);
        this.defineRoadPath(x, y, ROAD_PATH_HEAVY, ROAD_HEAVY == preferType, updatePathsMode);
        this.visibleUpdate(x, y);
        return change;
    }

    setPathsOnRoad(updateMode, zoneFrom, zoneTo, preferType, x, y) {
        if (zoneFrom == OVER_CENTER || zoneTo == OVER_CENTER) { return { prev: null, curr: null }; }
        return this.setPathsOnRoadByArr(updateMode, false, [zoneFrom, zoneTo], preferType, x, y);
    }
    setPathOnRoad(updateMode, zone, x, y) {
        if (zone == OVER_CENTER) { return { prev: null, curr: null }; }
        return this.setPathsOnRoadByArr(updateMode, false, [zone], ROAD_LIGHT, x, y);
    }

    setPathsOnRoadByTap(x, y) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road && !this.isCellEmpty(x, y)) { return null; }

        let countAround = this.countAnyObjectsAround(x, y);
        let emptyAround = !countAround;

        if (emptyAround && road) {
            if (!road.paths[ROAD_PATH_UP] && road.paths[ROAD_PATH_RIGHT] && !road.paths[ROAD_PATH_DOWN] && road.paths[ROAD_PATH_LEFT]) {
                return this.setPathsOnRoadByArr(false, true, [UP, DOWN], ROAD_LIGHT, x, y);
            }
            return false;
        }

        if (road && ROAD_LIGHT == road.type && this.countPathsSidesOfRoad(x, y) == 4) {
            return this.setPathsOnRoadByArr(false, false, [], ROAD_HEAVY, x, y);
        }
        if (road && ROAD_HEAVY != road.type) {
            return false;
        }
        else if (road && ROAD_HEAVY == road.type) {
            return false;
        }
        else if (!road) {
            let sides = [];
            if (this.isCellForForcedConnectionLeft(x, y)) { sides.push(LEFT); }
            if (this.isCellForForcedConnectionRight(x, y)) { sides.push(RIGHT); }
            if (this.isCellForForcedConnectionUp(x, y)) { sides.push(UP); }
            if (this.isCellForForcedConnectionDown(x, y)) { sides.push(DOWN); }

            if (sides.length > 1) { return this.setPathsOnRoadByArr(false, true, sides, null, x, y); }
            else { return this.setPathsOnRoadByArr(false, true, [LEFT, RIGHT], ROAD_LIGHT, x, y); }

            // this.defineRoadPath(x, y, ROAD_PATH_UP, !this.isCellEmpty(...this.Up(x, y)) && !this.isPerpendicularRoadAtSide(UP, x, y), updateMode);
            // this.defineRoadPath(x, y, ROAD_PATH_RIGHT, !this.isCellEmpty(...this.Right(x, y)) && !this.isPerpendicularRoadAtSide(RIGHT, x, y), updateMode);
            // this.defineRoadPath(x, y, ROAD_PATH_DOWN, !this.isCellEmpty(...this.Down(x, y)) && !this.isPerpendicularRoadAtSide(DOWN, x, y), updateMode);
            // this.defineRoadPath(x, y, ROAD_PATH_LEFT, !this.isCellEmpty(...this.Left(x, y)) && !this.isPerpendicularRoadAtSide(LEFT, x, y), updateMode);
        }
        return null;
    }

    updatePathsOnNeighborsRoads(x, y) {
        SIDES.map((toDir) => {
            // this.visibleUpdate(...this[toDir](x, y));
        });
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

    /** COLOR **/

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
                    this.disabledDirsToMoveColor(road, fromDir)
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

    /** ROADs BUILD **/

    buildingRoad = { start: [], path: [], way: {}, zoneStart: null, zonePainted: null };

    changeBuildRoadWayFixed() {
        if (this.isRoadBuildMode) {
            if (!this.buildingRoad.way.fixed) {
                this.buildingRoad.way.fixed = this.nextWayToBuildRoadOnQueue(this.buildingRoad.way.auto);
            }
            else {
                this.buildingRoad.way.fixed = this.nextWayToBuildRoadOnQueue(this.buildingRoad.way.fixed);
            }
        }
    }

    nextWayToBuildRoadOnQueue(prevQueue) {
        let nextAutoWay = BUILD_ROAD_WAY_HORZ_VERT;
        if (nextAutoWay == prevQueue) { nextAutoWay = BUILD_ROAD_WAY_VERT_HORZ; }
        return nextAutoWay;
    }

    get buildRoadWay() {
        if (this.buildingRoad.way.fixed) { return this.buildingRoad.way.fixed; }
        return this.buildingRoad.way.auto;
    }

    startToBuildRoad(x, y) {
        if (x != this.activeCursor.x || y != this.activeCursor.y) { return; }

        this.isRoadBuildMode = true;
        this.buildingRoad.start = [x, y];
        this.buildingRoad.zoneStart = this.buildingRoad.zonePainted = this.activeCursor.zone;
        this.buildingRoad.painted = [x, y];
        this.buildingRoad.path = [];
        this.buildingRoad.way = { auto: BUILD_ROAD_WAY_HORZ_VERT, fixed: null, last: null };
    }

    finishToBuildRoad() {
        this.isRoadBuildMode = false;
        this.afterChange();
    }

    buildRoadTick() {
        if (this.buildingRoad.painted[0] != this.activeCursor.x ||
            this.buildingRoad.painted[1] != this.activeCursor.y ||
            this.buildingRoad.zonePainted != this.activeCursor.zone ||
            this.buildingRoad.way.last != this.buildRoadWay
        ) {
            this.removePrevBuiltRoad();
            this.findWayToBuildRoad();
            if (this.isWayPossible(this.buildRoadWay)) {
                this.doBuildRoad();
            }

            this.buildingRoad.way.last = this.buildRoadWay;
            this.buildingRoad.painted[0] = this.activeCursor.x;
            this.buildingRoad.painted[1] = this.activeCursor.y;
            this.buildingRoad.zonePainted = this.activeCursor.zone;
        }
    }

    removePrevBuiltRoad() {
        this.buildingRoad.path.map((roadCellMem) => {
            if (roadCellMem.change.curr) {
                if (!roadCellMem.change.prev) {
                    this.removeRoad(...roadCellMem.position);
                }
                else {
                    let road = this.findCellOrEmpty(...roadCellMem.position).road;
                    road.type = roadCellMem.change.prev;
                    road.paths = roadCellMem.change.prevPaths;
                    this.visibleUpdate(...roadCellMem.position);
                    this.afterPutRoad(...roadCellMem.position);
                }
            }
        })
        this.buildingRoad.path = [];
    }

    doBuildRoad() {
        if (this.buildingRoad.start[0] == this.activeCursor.x && this.buildingRoad.start[1] == this.activeCursor.y) {
            return;
        }

        let xCell = this.buildingRoad.start[0];
        let yCell = this.buildingRoad.start[1];
        let xStep = this.activeCursor.x > this.buildingRoad.start[0] ? 1 : -1;
        let yStep = this.activeCursor.y > this.buildingRoad.start[1] ? 1 : -1;

        let isFirstHorizontal = this.activeCursor.x != this.buildingRoad.start[0];

        if (BUILD_ROAD_WAY_HORZ_VERT == this.buildRoadWay) {
            let changeParams, zoneTo;
            if (isFirstHorizontal) {
                zoneTo = xStep > 0 ? RIGHT : LEFT;
            }
            else {
                zoneTo = yStep > 0 ? DOWN : UP;
            }

            // first cell of road logic
            if (this.buildingRoad.zoneStart == OVER_CENTER || this.buildingRoad.zoneStart == zoneTo || this.buildingRoad.zoneStart == OPPOSITE_SIDE[zoneTo]) {
                changeParams = isFirstHorizontal ? this.putRoadHorizontal(xCell, yCell) : this.putRoadVertical(xCell, yCell);
            }
            else {
                changeParams = this.putRoadZonal(this.buildingRoad.zoneStart, zoneTo, xCell, yCell);
            }
            this.buildingRoad.path.push({ change: changeParams, position: [xCell, yCell]});

            while (xCell != this.activeCursor.x) {
                xCell += xStep;
                if (xCell == this.activeCursor.x) // last horizontal cell
                {
                    let zoneFrom = xStep > 0 ? LEFT : RIGHT;

                    if (yCell != this.activeCursor.y) { // turning cell
                        let zoneTo = yStep > 0 ? DOWN : UP;
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, xCell, yCell), position: [xCell, yCell]});
                    }
                    else { // last cell of road logic when road is horizontal line
                        let zoneTo = this.activeCursor.zone;

                        if ((this.isCellEmpty(xCell, yCell) && zoneFrom == zoneTo) || zoneTo == OVER_CENTER || zoneFrom == OPPOSITE_SIDE[zoneTo]) {
                            this.buildingRoad.path.push({ change: this.putRoadHorizontal(xCell, yCell), position: [xCell, yCell]});
                        }
                        else if (zoneFrom == zoneTo) {
                            this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, xCell, yCell), position: [xCell, yCell]});
                        }
                        else {
                            this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, xCell, yCell), position: [xCell, yCell]});
                        }
                    }
                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadHorizontal(xCell, yCell), position: [xCell, yCell]});
                }
            }
            while (yCell != this.activeCursor.y) {
                yCell += yStep;
                if (yCell == this.activeCursor.y) { // last vertical cell of the road-with-corner logic
                    let zoneFrom = yStep > 0 ? UP : DOWN;
                    let zoneTo = this.activeCursor.zone;

                    if ((this.isCellEmpty(xCell, yCell) && zoneFrom == zoneTo) || zoneTo == OVER_CENTER || zoneFrom == OPPOSITE_SIDE[zoneTo]) {
                        this.buildingRoad.path.push({ change: this.putRoadVertical(xCell, yCell), position: [xCell, yCell]});
                    }
                    else if (zoneFrom == zoneTo) {
                        this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, xCell, yCell), position: [xCell, yCell]});
                    }
                    else {
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, xCell, yCell), position: [xCell, yCell]});
                    }
                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadVertical(xCell, yCell), position: [xCell, yCell]});
                }
            }
        }
        else if (BUILD_ROAD_WAY_VERT_HORZ == this.buildRoadWay) {
            let zoneTo = yStep > 0 ? DOWN : UP;

            // first cell of road logic
            if (this.buildingRoad.zoneStart == OVER_CENTER || this.buildingRoad.zoneStart == zoneTo || this.buildingRoad.zoneStart == OPPOSITE_SIDE[zoneTo]) {
                this.buildingRoad.path.push({ change: this.putRoadVertical(xCell, yCell), position: [xCell, yCell]});
            }
            else {
                this.buildingRoad.path.push({ change: this.putRoadZonal(this.buildingRoad.zoneStart, zoneTo, xCell, yCell), position: [xCell, yCell]});
            }

            while (yCell != this.activeCursor.y) {
                yCell += yStep;
                if (yCell == this.activeCursor.y) // last vertical cell
                {
                    let zoneFrom = yStep > 0 ? UP : DOWN;

                    if (xCell != this.activeCursor.x) { // turning cell
                        zoneTo = xStep > 0 ? RIGHT : LEFT;
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, xCell, yCell), position: [xCell, yCell]});
                    }
                    else { // last cell of road logic when road is vertical line
                        let zoneTo = this.activeCursor.zone;

                        if ((this.isCellEmpty(xCell, yCell) && zoneFrom == zoneTo) || zoneTo == OVER_CENTER || zoneFrom == OPPOSITE_SIDE[zoneTo]) {
                            this.buildingRoad.path.push({ change: this.putRoadHorizontal(xCell, yCell), position: [xCell, yCell]});
                        }
                        else if (zoneFrom == zoneTo) {
                            this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, xCell, yCell), position: [xCell, yCell]});
                        }
                        else {
                            this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, xCell, yCell), position: [xCell, yCell]});
                        }
                    }

                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadVertical(xCell, yCell), position: [xCell, yCell]});
                }
            }
            while (xCell != this.activeCursor.x) {
                xCell += xStep;
                if (xCell == this.activeCursor.x) { // last horizontal cell of the road-with-corner logic
                    let zoneFrom = xStep > 0 ? LEFT : RIGHT;
                    let zoneTo = this.activeCursor.zone;

                    if ((this.isCellEmpty(xCell, yCell) && zoneFrom == zoneTo) || zoneTo == OVER_CENTER || zoneFrom == OPPOSITE_SIDE[zoneTo]) {
                        this.buildingRoad.path.push({ change: this.putRoadHorizontal(xCell, yCell), position: [xCell, yCell]});
                    }
                    else if (zoneFrom == zoneTo) {
                        this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, xCell, yCell), position: [xCell, yCell]});
                    }
                    else {
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, xCell, yCell), position: [xCell, yCell]});
                    }
                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadHorizontal(xCell, yCell), position: [xCell, yCell]});
                }
            }
        }
    }

    findWayToBuildRoad() {
        this.buildingRoad.way.auto = BUILD_ROAD_WAY_HORZ_VERT;
        let xCell = this.buildingRoad.start[0];
        let yCell = this.buildingRoad.start[1];
        let xStep = this.activeCursor.x > this.buildingRoad.start[0] ? 1 : -1;
        let yStep = this.activeCursor.y > this.buildingRoad.start[1] ? 1 : -1;
        let isFirstHorizontal = this.activeCursor.x != this.buildingRoad.start[0];

        let theWay = BUILD_ROAD_WAY_HORZ_VERT;
        while (theWay && xCell != this.activeCursor.x) {
            xCell += xStep;
            if (!this.isRoadPathsEmptyHorizontal(xCell, yCell)) {
                theWay = false;
            }
        }
        if (isFirstHorizontal && yCell != this.activeCursor.y && !this.isRoadPathsEmptyVertical(xCell, yCell)) {
            theWay = false; // corner check
        }
        while (theWay && yCell != this.activeCursor.y) {
            yCell += yStep;
            if (!this.isRoadPathsEmptyVertical(xCell, yCell)) {
                theWay = false;
            }
        }

        if (theWay) { this.buildingRoad.way.auto = theWay; return; }

        xCell = this.buildingRoad.start[0];
        yCell = this.buildingRoad.start[1];

        if (this.activeCursor.x != this.buildingRoad.start[0] && this.activeCursor.y != this.buildingRoad.start[1])
        {
            theWay = BUILD_ROAD_WAY_VERT_HORZ;
            while (theWay && yCell != this.activeCursor.y) {
                yCell += yStep;
                if (!this.isRoadPathsEmptyVertical(xCell, yCell)) {
                    theWay = false;
                }
            }
            if (!this.isRoadPathsEmptyHorizontal(xCell, yCell)) {
                theWay = false; // corner check
            }
            while (theWay && xCell != this.activeCursor.x) {
                xCell += xStep;
                if (!this.isRoadPathsEmptyHorizontal(xCell, yCell)) {
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

        let xStep = this.activeCursor.x > this.buildingRoad.start[0] ? 1 : -1;
        let yStep = this.activeCursor.y > this.buildingRoad.start[1] ? 1 : -1;

        if (BUILD_ROAD_WAY_HORZ_VERT == theWay) {
            while (xCell != this.activeCursor.x) {
                xCell += xStep;
                if (!this.canSetRoad(xCell, yCell)) { return false; }
            }
            while (yCell != this.activeCursor.y) {
                yCell += yStep;
                if (!this.canSetRoad(xCell, yCell)) { return false; }
            }
        }
        else if (BUILD_ROAD_WAY_VERT_HORZ == theWay) {
            while (yCell != this.activeCursor.y) {
                yCell += yStep;
                if (!this.canSetRoad(xCell, yCell)) { return false; }
            }
            while (xCell != this.activeCursor.x) {
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
            delete(this.contentCells[this.cellName(x, y)]);
        }
        else if (ST_ROAD_SLEEP == scType) {
            this.putSleepSemiconductor(x, y);
        }
        else if (ST_ROAD_AWAKE == scType) {
            this.putAwakeSemiconductor(x, y);
        }
        this.visibleUpdate(x, y);
        this.updatePathsOnNeighborsRoads(x, y);
        this.afterChange();
    }

    putSleepSemiconductor(x, y) {
        if (this.isChargedSemiconductorAround(x, y) ||
            this.isSemiconductorTypeAround(ST_ROAD_SLEEP, x, y))
            //|| 1 < this.countSemiconductorTypeAround(ST_ROAD_AWAKE, x, y))
        {
            return;
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
        this.contentCells[this.cellName(x, y)] = [x, y];
        this.setColorToNewSemiconductor(x, y);
    }
    
    putAwakeSemiconductor(x, y) {
        if (this.isChargedSemiconductorAround(x, y)) {
            return;
        }

        let clusterFree = this.allowedAmountOfAwakesCluster - 1;
        SIDES.map((side) => {
            clusterFree -= this.countAwakeClusterAtSide(null, side, x, y);
        })
        if (clusterFree >= 0) {
            this.changeCellSemiconductor({ type: ST_ROAD_AWAKE, direction: ROAD_HEAVY }, x, y);
            this.setColorToNewSemiconductor(x, y);
            SIDES.map((side) => {
                if (this.turnSleepSemiconductorHere(side, x, y)) {
                    this.visibleUpdate(...this[side](x, y));
                    this.cancelNeighborsColorPathForAnyRoadByPaths(ALL_PATHS_ARE, ...this[side](x, y));
                }
            })
        }
    }

    setColorToNewSemiconductor(x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi) { return; }

        SIDES.map((fromSide) => {
            let cellNeighbor = this.findCellOrEmpty(...this[fromSide](x, y))

            let stoneNeighbor = cellNeighbor.content;
            if (stoneNeighbor) {
                setTimeout(() => {this.setAwakeColorSemiconductorByStone(STONE_TYPE_TO_ROAD_COLOR[stoneNeighbor], x, y)}, NANO_MS);
            }

            if (semi.colorAwake) { return; }
            let semiNeighbor = cellNeighbor.semiconductor;
            if (!semiNeighbor) { return; }

            if (ST_ROAD_AWAKE == semiNeighbor.type) {
                semi.colorAwake = semiNeighbor.colorAwake;
            }
        })
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
                if (this.isConnectedSemiconductorAtSideToThisSemiconductor(toDir, x, y)) {
                    this.setAwakeColorSemiconductorByStone(semi.colorAwake, ...this[toDir](x, y));
                }
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
                if (this.isConnectedSemiconductorAtSideToThisSemiconductor(toDir, x, y)) {
                    this.setChargeColorToSemiconductorByAwake(color, ...this[toDir](x, y));
                }
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
        if (ST_ROAD_SLEEP == semi.type && !this.isSemiSleepConnectedToSide(semi, fromDir)) { return; }

        semi.colorFlow = color;
        semi.from = fromDir;
        this.visibleUpdate(x, y);

        if (!color) {
            this.removeColoringCellCache(x, y);
        }

        let sides = SIDES;
        if (ST_ROAD_SLEEP == semi.type) { sides = [OPPOSITE_SIDE[fromDir]]; }

        sides.map((toDir) => {
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
            let toDir = OPPOSITE_SIDE[semi.from];
            if (color) {
                this.coloringCellCache(x, y).push({
                    type: ST_ROAD_SLEEP,
                    method: 'setColorAroundBySleep',
                    params: [true, x, y],
                    cacheDirections: [toDir],
                });
            }
            else {
                if (this.isAnyRoadAtSide(toDir, x, y)) {
                    this.cancelColorOnRoadCell(null, semi.from, ...this[toDir](x, y));
                }
            }
        }
    }

    setColorAroundBySleep(forced, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi || ST_ROAD_SLEEP != semi.type || (!forced && !semi.colorFlow)) { return; }

        let toDir = OPPOSITE_SIDE[semi.from];

        if (semi.colorFlow) {
            if (this.isUncoloredRoadAtSide(toDir, x, y)) {
                this.setColorToRoad(semi.colorFlow, semi.from, ...this[toDir](x, y));
            }
        }
        else {
            if (this.isAnyRoadAtSide(toDir, x, y)) {
                this.cancelColorOnRoadCell(null, OPPOSITE_SIDE[toDir], ...this[toDir](x, y));
            }
        }
    }

}
