class Scheme extends AbstractScheme {

    /** STONEs **/

    putContent(type, x, y) {
        let oldType = this.findContentCellOrEmpty(x, y).content;
        if (oldType != type) { this.cancelColorOnNeighborsRoads(ALL_PATHS_ARE, x, y); }
        this.contentCells[this.cellName(x, y)] = [x, y];
        this.changeCellContent(type, x, y);
        this.visibleUpdate(x, y);
        this.updatePathsOnNeighborsRoads(x, y);
        if (oldType != type) { this.cancelColorOnNeighborsRoads(ALL_PATHS_ARE, x, y); }

        SIDES.map((sideTo) => {
            this.setAwakeColorSemiconductorByStone(STONE_TYPE_TO_ROAD_COLOR[type], ...this[sideTo](x, y))
        });

        if (this.coloringAwaitTick) {
            this.coloringCellCache(x, y).push({
                type: type,
                method: 'setColorAroundByStone',
                params: [x, y],
            });
        }
    }

    removeContent(x, y) {
        if (!this.findCellOrEmpty(x, y).content) { return; }
        this.cancelColorOnNeighborsRoads(ALL_PATHS_ARE, x, y);
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
        this.cancelColorOnNeighborsRoads(this.findCellOrEmpty(x, y).road.paths, x, y);
    }

    makeRoadHeavy(x, y) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road || ROAD_HEAVY == road.type || this.countObjectsAround(x, y) < 3) { return false; }

        road.type = ROAD_HEAVY;
        this.removeColoringCellCache(x, y);
        this.resetPathsOnRoad(x, y);
        this.visibleUpdate(x, y);
        this.cancelColorOnNeighborsRoads(this.findCellOrEmpty(x, y).road.paths, x, y);
        //this.doCheckRunForRoads(null, ...this.schemePosition);
        return true;
    }

    removeRoad(x, y) {
        this.cancelColorOnNeighborsRoads(this.findCellOrEmpty(x, y).road.paths, x, y);

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

    cancelColorOnRoad(checkRun, fromDir, x, y) {
        let road = this.findCellOrEmpty(x, y).road;
        if (!road) { return; }

        if (!checkRun) {
            checkRun = this.constructor.checkRun;
        }
        else if (checkRun == road.checkRun) { return; }
        road.checkRun = checkRun;

        let fromPath = SIDE_TO_ROAD_PATH[fromDir];
        let oppositePath = SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[fromDir]];

        if (road.paths[fromPath]) {
            if (this.canPathCancelColor(road, fromPath)) {
                road.paths[fromPath] = true;
            }
            this.removeColoringCellCache(x, y);
        }

        if (road.paths[oppositePath]) {
            if (this.canPathCancelColor(road, oppositePath)) {
                road.paths[oppositePath] = true;
            }
            this.removeColoringCellCache(x, y);
            this.cancelColorOnRoad(checkRun, fromDir, ...this[OPPOSITE_SIDE[fromDir]](x, y));
            this.setColorToSemiconductorByRoad(null, fromDir, ...this[OPPOSITE_SIDE[fromDir]](x, y));
        }

        if (this.canPathCancelColor(road, ROAD_PATH_HEAVY)) {
            road.paths[ROAD_PATH_HEAVY] = true;
        }

        if (!road.paths[oppositePath] || road.paths[ROAD_PATH_HEAVY])
        {
            SIDES_TURN_90[fromDir].map((turnSide) => {
                let turnPath = SIDE_TO_ROAD_PATH[turnSide];
                if (this.canPathCancelColor(road, turnPath)) {
                    road.paths[turnPath] = true;
                }
                if (road.paths[turnPath]) {
                    this.removeColoringCellCache(x, y);
                    this.cancelColorOnRoad(checkRun, OPPOSITE_SIDE[turnSide], ...this[turnSide](x, y))
                    this.setColorToSemiconductorByRoad(null, OPPOSITE_SIDE[turnSide], ...this[turnSide](x, y))
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

    cancelColorOnNeighborsRoads(roadPaths, x, y) {
        SIDES.map((toDir) => {
            let toPath = SIDE_TO_ROAD_PATH[toDir];
            if (roadPaths[toPath]) {
                let roadNeighbor = this.findCellOrEmpty(...this[toDir](x, y)).road;
                if (!roadNeighbor || !roadNeighbor.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[toDir]]]) { return; }

                this.cancelColorOnRoad(null, OPPOSITE_SIDE[toDir], ...this[toDir](x, y));
            }
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

    cancelColorOnDefineRoadPath(x, y, pathType) {
        if (ROAD_PATH_TO_SIDE.hasOwnProperty(pathType)) {
            let toDir = ROAD_PATH_TO_SIDE[pathType];
            let toDirRoad = this.findCellOrEmpty(...this[toDir](x, y)).road;
            if (toDirRoad && toDirRoad.paths[SIDE_TO_ROAD_PATH[OPPOSITE_SIDE[toDir]]]) {
                this.cancelColorOnRoad(null, OPPOSITE_SIDE[toDir], ...this[toDir](x, y));
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

    canPathSetColor(road, pathType) { return true === road.paths[pathType]; }
    canPathCancelColor(road, pathType) { return !!(true !== road.paths[pathType] && road.paths[pathType]); }

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
        });

        this.coloringCellCache(x, y).push({
            type: ST_ROAD,
            method: 'moveColorToNextCells',
            params: [x, y, nextSides, color],
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

    setAwakeColorSemiconductorByStone(color, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi || semi.colorAwake == color) { return; }

        semi.colorAwake = color;
        if (!color || semi.colorCharge && semi.colorCharge != semi.colorAwake) { semi.colorCharge = null; }
        this.visibleUpdate(x, y);

        this.removeColoringCellCache(x, y);
        this.cancelColorOnNeighborsRoads(ALL_PATHS_ARE, x, y);

        if (ST_ROAD_AWAKE == semi.type) {
            SIDES.map((toDir) => {
                this.setAwakeColorSemiconductorByStone(semi.colorAwake, ...this[toDir](x, y));
            });
        }
    }

    setChargeColorToSemiconductorByAwake(color, x, y) {
        let semi = this.findCellOrEmpty(x, y).semiconductor;
        if (!semi || semi.colorCharge == color || (color && (semi.colorCharge == color || semi.colorAwake != color))) { return; }

        semi.colorCharge = color;
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

        if (!checkRun) { checkRun = this.constructor.checkRun; }
        if (semi.checkRun == checkRun) { return false; }
        semi.checkRun = checkRun;

        for (let ix = 0; ix < SIDES.length; ix++) {
            let fromDir = SIDES[ix];

            if (this.isRoadFlowColorToSide(semi.colorCharge, OPPOSITE_SIDE[fromDir], ...this[fromDir](x, y))) {
                return true;
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
                        });
                    }
                }
                else {
                    if (this.isAnyRoadAtSide(toDir, x, y)) {
                        this.cancelColorOnRoad(null, OPPOSITE_SIDE[toDir], ...nextXY);
                    }
                }
            });
        }
    }

    isSemiconductorTypeLeftOrRight(scType, x, y) { return scType == this.findSemiconductorCellOrEmpty(x + 1, y).semiconductor.type || scType == this.findSemiconductorCellOrEmpty(x - 1, y).semiconductor.type; }
}
