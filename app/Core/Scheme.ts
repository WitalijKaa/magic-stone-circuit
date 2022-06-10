import * as CONF from "../config/game"
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {SchemeBase} from "./SchemeBase";
import {IPoss} from "./IPoss";
import {CellStone} from "./Types/CellStone";
import {CellRoad, CellRoadType, RoadChangeHistory, RoadChangeHistoryCell} from "./Types/CellRoad";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {BuildRoadWays} from "./Types/BuildRoadWays";
import {GridZone} from "./Types/GridCursor";
import {DirSide} from "./Types/DirectionSide";
import {Cell} from "./Cell";

export class Scheme extends SchemeBase {

    visibleUpdate(poss: IPoss) {
        this.visibleGrid.refreshVisibleCell(poss);
    }
    afterChange() {}

    /** STONEs **/

    putContent(type: CellStone, poss: IPoss) : void {
        let cell = this.getCellForContent(poss);
        if (!cell) { return; }
        //let oldType = cell.content;
        //if (oldType != type) { this.cancelNeighborsColorPathForAnyRoadByPaths(CONF.ALL_PATHS_ARE, x, y); }
        cell.content = type;
        this.contentCells[this.cellName(poss)] = poss;
        this.visibleUpdate(poss);
        //this.updatePathsOnNeighborsRoads(x, y);
        //if (oldType != type) { this.cancelNeighborsColorPathForAnyRoadByPaths(CONF.ALL_PATHS_ARE, x, y); }

        // CONF.SIDES.map((sideTo) => {
        //     //this.setAwakeColorSemiconductorByStone(STONE_TYPE_TO_ROAD_COLOR[type], ...this[sideTo](x, y))
        // });

        // if (this.coloringAwaitTick) {
        //     this.coloringCellCache(poss).push({
        //         type: CONF.ST_STONE_VIOLET,
        //         method: 'setColorAroundByStone',
        //         params: [poss.x, poss.y],
        //         cacheDirections: [...CONF.SIDES],
        //     });
        // }

        this.afterChange();
    }

    removeContent(poss: IPoss) {
        let cell = this.findCellOfContent(poss);
        if (!cell) { return; }
        //this.cancelNeighborsColorPathForAnyRoadByPaths(CONF.ALL_PATHS_ARE, x, y);
        CONF.SIDES.map((sideTo) => {
            //this.setAwakeColorSemiconductorByStone(null, ...this[sideTo](x, y))
        });
        delete(this.contentCells[this.cellName(poss)]);
        this.killCell(poss);
        //this.updatePathsOnNeighborsRoads(x, y);
        // todo remove

        this.afterChange();
    }

    setColorAroundByStone(poss: IPoss) {
        let cell = this.findCellOfContent(poss);
        if (!cell) { return; }

        SIDES.map((sideTo) => {
            //this.setColorToRoad(CONF.STONE_TYPE_TO_ROAD_COLOR[cell.content], CONF.OPPOSITE_SIDE[sideTo], ...this[sideTo](x, y))
        });
    }

    /** ROADs **/

    tapRoad(poss: IPoss) {
        if (this.isRoadBuildMode) { return; }

        if (false === this.setPathsOnRoadByTap(poss)) {
            this.removeRoad(poss);
        }
        this.removeColoringCellCache(poss);
        this.afterChange();
    }

    putRoadHorizontal(poss: IPoss) {
        let preferType = ROAD_LEFT_RIGHT;
        let cell = this.getCellForRoad(poss);
        if (cell) {
            let mergedZones = this.mergeZones([LEFT, RIGHT], poss);
            if (ROAD_HEAVY == cell.road.type || mergedZones.length == 3) {
                preferType = ROAD_HEAVY;
            }
        }

        return this.setPathsOnRoad(false, LEFT, RIGHT, preferType, poss);
    }

    putRoadZonal(zoneFrom, zoneTo, poss: IPoss) {
        let preferType = ROAD_LIGHT;
        let cell = this.getCellForRoad(poss);
        if (cell) {
            let mergedZones = this.mergeZones([zoneFrom, zoneTo], poss);
            if (ROAD_HEAVY == cell.road.type || mergedZones.length > 2) {
                preferType = ROAD_HEAVY;
            }
        }

        return this.setPathsOnRoad(false, zoneFrom, zoneTo, preferType, poss);
    }

    putRoadVertical(poss: IPoss) {
        let preferType = ROAD_UP_DOWN;
        let cell = this.getCellForRoad(poss);
        if (cell) {
            let mergedZones = this.mergeZones([UP, DOWN], poss);
            if (ROAD_HEAVY == cell.road.type || mergedZones.length == 3) {
                preferType = ROAD_HEAVY;
            }
        }

        return this.setPathsOnRoad(false, UP, DOWN, preferType, poss);
    }

    afterPutRoad(poss: IPoss) {
        this.removeColoringCellCache(poss);
        //this.cancelNeighborsColorPathForAnyRoadByPaths(this.findCellOrEmpty(poss).road.paths, poss);
    }

    removeRoad(poss: IPoss) {
        if (!this.findCellOfRoad(poss)) { return; }

        //this.cancelNeighborsColorPathForAnyRoadByPaths(CONF.ALL_PATHS_ARE, poss);

        this.killCell(poss);
        this.removeColoringCellCache(poss);
        this.visibleUpdate(poss);
        this.afterChange();
    }

    /** ROADs BUILD **/

    public get isRoadBuildMode() : boolean { return this.buildingRoad.isOn; }

    private buildingRoad = {
        isOn: false as boolean,
        start: {} as IPoss,
        painted: {} as IPoss,
        path: [] as Array<RoadChangeHistoryCell>,
        way: {} as { fixed: BuildRoadWays | null, last: BuildRoadWays | null, auto: BuildRoadWays },
        zoneStart: 'Center' as GridZone,
        zonePainted: 'Center' as GridZone,
    };

    changeBuildRoadWayFixed() : void {
        if (this.isRoadBuildMode) {
            if (!this.buildingRoad.way.fixed) {
                this.buildingRoad.way.fixed = this.nextWayToBuildRoadOnQueue(this.buildingRoad.way.auto);
            }
            else {
                this.buildingRoad.way.fixed = this.nextWayToBuildRoadOnQueue(this.buildingRoad.way.fixed);
            }
        }
    }

    nextWayToBuildRoadOnQueue(prevQueue) : BuildRoadWays {
        let nextAutoWay: BuildRoadWays = CONF.BUILD_ROAD_WAY_HORZ_VERT;
        if (nextAutoWay == prevQueue) { nextAutoWay = CONF.BUILD_ROAD_WAY_VERT_HORZ; }
        return nextAutoWay;
    }

    get buildRoadWay() : BuildRoadWays {
        if (this.buildingRoad.way.fixed) { return this.buildingRoad.way.fixed; }
        return this.buildingRoad.way.auto;
    }

    startToBuildRoad(poss: IPoss) : void {
        if (this.buildingRoad.isOn || poss.x != this.activeCursor.x || poss.y != this.activeCursor.y) { return; }

        this.buildingRoad.isOn = true;
        this.buildingRoad.start = this.iPossClone(poss);
        this.buildingRoad.zoneStart = this.buildingRoad.zonePainted = this.activeCursor.zone;
        this.buildingRoad.painted = this.iPossClone(poss);
        this.buildingRoad.path = [];
        this.buildingRoad.way = { auto: CONF.BUILD_ROAD_WAY_HORZ_VERT, fixed: null, last: null };
    }

    finishToBuildRoad() : void {
        this.buildingRoad.isOn = false;
        this.afterChange();
    }

    buildRoadTick() : void {
        if (this.buildingRoad.painted.x != this.activeCursor.x ||
            this.buildingRoad.painted.y != this.activeCursor.y ||
            this.buildingRoad.zonePainted != this.activeCursor.zone ||
            this.buildingRoad.way.last != this.buildRoadWay
        ) {
            this.removePrevBuiltRoad();
            this.findWayToBuildRoad();
            if (this.isWayPossible(this.buildRoadWay)) {
                this.doBuildRoad();
            }

            this.buildingRoad.way.last = this.buildRoadWay;
            this.buildingRoad.painted.x = this.activeCursor.x;
            this.buildingRoad.painted.y = this.activeCursor.y;
            this.buildingRoad.zonePainted = this.activeCursor.zone;
        }
    }

    removePrevBuiltRoad() {
        this.buildingRoad.path.map((roadCellMem: RoadChangeHistoryCell) => {
            if (roadCellMem.change.curr) {
                if (!roadCellMem.change.prev) {
                    this.removeRoad(roadCellMem.position);
                }
                else if (roadCellMem.change.prevPaths) {
                    let road = this.getCellForRoadForced(roadCellMem.position).road;
                    road.type = roadCellMem.change.prev;
                    road.paths = roadCellMem.change.prevPaths;
                    this.visibleUpdate(roadCellMem.position);
                    this.afterPutRoad(roadCellMem.position);
                }
            }
        })
        this.buildingRoad.path = [];
    }

    doBuildRoad() {
        if (this.buildingRoad.start.x == this.activeCursor.x && this.buildingRoad.start.y == this.activeCursor.y) {
            return;
        }

        let cellStart : IPoss = { x: this.buildingRoad.start.x, y: this.buildingRoad.start.y };
        let xStep = this.activeCursor.x > this.buildingRoad.start.x ? 1 : -1;
        let yStep = this.activeCursor.y > this.buildingRoad.start.y ? 1 : -1;

        let isFirstHorizontal = this.activeCursor.x != this.buildingRoad.start.x;

        if (CONF.BUILD_ROAD_WAY_HORZ_VERT == this.buildRoadWay) {
            let changeParams, zoneTo;
            if (isFirstHorizontal) {
                zoneTo = xStep > 0 ? RIGHT : LEFT;
            }
            else {
                zoneTo = yStep > 0 ? DOWN : UP;
            }

            // first cell of road logic
            if (this.buildingRoad.zoneStart == CONF.OVER_CENTER || this.buildingRoad.zoneStart == zoneTo || this.buildingRoad.zoneStart == CONF.OPPOSITE_SIDE[zoneTo]) {
                changeParams = isFirstHorizontal ? this.putRoadHorizontal(cellStart) : this.putRoadVertical(cellStart);
            }
            else {
                changeParams = this.putRoadZonal(this.buildingRoad.zoneStart, zoneTo, cellStart);
            }
            this.buildingRoad.path.push({ change: changeParams, position: this.iPossClone(cellStart)});

            while (cellStart.x != this.activeCursor.x) {
                cellStart.x += xStep;
                if (cellStart.x == this.activeCursor.x) // last horizontal cell
                {
                    let zoneFrom = xStep > 0 ? LEFT : RIGHT;

                    if (cellStart.y != this.activeCursor.y) { // turning cell
                        let zoneTo = yStep > 0 ? DOWN : UP;
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellStart), position: this.iPossClone(cellStart)});
                    }
                    else { // last cell of road logic when road is horizontal line
                        let zoneTo = this.activeCursor.zone;

                        if ((this.isCellEmpty(cellStart) && zoneFrom == zoneTo) || zoneTo == CONF.OVER_CENTER || zoneFrom == CONF.OPPOSITE_SIDE[zoneTo]) {
                            this.buildingRoad.path.push({ change: this.putRoadHorizontal(cellStart), position: this.iPossClone(cellStart)});
                        }
                        else if (zoneFrom == zoneTo) {
                            this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, cellStart), position: this.iPossClone(cellStart)});
                        }
                        else {
                            this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellStart), position: this.iPossClone(cellStart)});
                        }
                    }
                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadHorizontal(cellStart), position: this.iPossClone(cellStart)});
                }
            }
            while (cellStart.y != this.activeCursor.y) {
                cellStart.y += yStep;
                if (cellStart.y == this.activeCursor.y) { // last vertical cell of the road-with-corner logic
                    let zoneFrom = yStep > 0 ? UP : DOWN;
                    let zoneTo = this.activeCursor.zone;

                    if ((this.isCellEmpty(cellStart) && zoneFrom == zoneTo) || zoneTo == CONF.OVER_CENTER || zoneFrom == CONF.OPPOSITE_SIDE[zoneTo]) {
                        this.buildingRoad.path.push({ change: this.putRoadVertical(cellStart), position: this.iPossClone(cellStart)});
                    }
                    else if (zoneFrom == zoneTo) {
                        this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, cellStart), position: this.iPossClone(cellStart)});
                    }
                    else {
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellStart), position: this.iPossClone(cellStart)});
                    }
                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadVertical(cellStart), position: this.iPossClone(cellStart)});
                }
            }
        }
        else if (CONF.BUILD_ROAD_WAY_VERT_HORZ == this.buildRoadWay) {
            let zoneTo = yStep > 0 ? DOWN : UP;

            // first cell of road logic
            if (this.buildingRoad.zoneStart == CONF.OVER_CENTER || this.buildingRoad.zoneStart == zoneTo || this.buildingRoad.zoneStart == CONF.OPPOSITE_SIDE[zoneTo]) {
                this.buildingRoad.path.push({ change: this.putRoadVertical(cellStart), position: this.iPossClone(cellStart)});
            }
            else {
                this.buildingRoad.path.push({ change: this.putRoadZonal(this.buildingRoad.zoneStart, zoneTo, cellStart), position: this.iPossClone(cellStart)});
            }

            while (cellStart.y != this.activeCursor.y) {
                cellStart.y += yStep;
                if (cellStart.y == this.activeCursor.y) // last vertical cell
                {
                    let zoneFrom = yStep > 0 ? UP : DOWN;

                    if (cellStart.x != this.activeCursor.x) { // turning cell
                        zoneTo = xStep > 0 ? RIGHT : LEFT;
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellStart), position: this.iPossClone(cellStart)});
                    }
                    else { // last cell of road logic when road is vertical line
                        let zoneTo = this.activeCursor.zone;

                        if ((this.isCellEmpty(cellStart) && zoneFrom == zoneTo) || zoneTo == CONF.OVER_CENTER || zoneFrom == CONF.OPPOSITE_SIDE[zoneTo]) {
                            this.buildingRoad.path.push({ change: this.putRoadHorizontal(cellStart), position: this.iPossClone(cellStart)});
                        }
                        else if (zoneFrom == zoneTo) {
                            this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, cellStart), position: this.iPossClone(cellStart)});
                        }
                        else {
                            this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellStart), position: this.iPossClone(cellStart)});
                        }
                    }

                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadVertical(cellStart), position: this.iPossClone(cellStart)});
                }
            }
            while (cellStart.x != this.activeCursor.x) {
                cellStart.x += xStep;
                if (cellStart.x == this.activeCursor.x) { // last horizontal cell of the road-with-corner logic
                    let zoneFrom = xStep > 0 ? LEFT : RIGHT;
                    let zoneTo = this.activeCursor.zone;

                    if ((this.isCellEmpty(cellStart) && zoneFrom == zoneTo) || zoneTo == CONF.OVER_CENTER || zoneFrom == CONF.OPPOSITE_SIDE[zoneTo]) {
                        this.buildingRoad.path.push({ change: this.putRoadHorizontal(cellStart), position: this.iPossClone(cellStart)});
                    }
                    else if (zoneFrom == zoneTo) {
                        this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, cellStart), position: this.iPossClone(cellStart)});
                    }
                    else {
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellStart), position: this.iPossClone(cellStart)});
                    }
                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadHorizontal(cellStart), position: this.iPossClone(cellStart)});
                }
            }
        }
    }

    findWayToBuildRoad() {
        this.buildingRoad.way.auto = CONF.BUILD_ROAD_WAY_HORZ_VERT;
        let cellStart : IPoss = { x: this.buildingRoad.start.x, y: this.buildingRoad.start.y };
        let xStep = this.activeCursor.x > this.buildingRoad.start.x ? 1 : -1;
        let yStep = this.activeCursor.y > this.buildingRoad.start.y ? 1 : -1;
        let isFirstHorizontal = this.activeCursor.x != this.buildingRoad.start.x;

        let theWay : boolean | BuildRoadWays = CONF.BUILD_ROAD_WAY_HORZ_VERT;
        while (theWay && cellStart.x != this.activeCursor.x) {
            cellStart.x += xStep;
            if (!this.isRoadPathsEmptyHorizontal(cellStart)) {
                theWay = false;
            }
        }
        if (isFirstHorizontal && cellStart.y != this.activeCursor.y && !this.isRoadPathsEmptyVertical(cellStart)) {
            theWay = false; // corner check
        }
        while (theWay && cellStart.y != this.activeCursor.y) {
            cellStart.y += yStep;
            if (!this.isRoadPathsEmptyVertical(cellStart)) {
                theWay = false;
            }
        }

        if (theWay) { this.buildingRoad.way.auto = theWay; return; }

        cellStart = { x: this.buildingRoad.start.x, y: this.buildingRoad.start.y };

        if (this.activeCursor.x != this.buildingRoad.start.x && this.activeCursor.y != this.buildingRoad.start.y)
        {
            theWay = CONF.BUILD_ROAD_WAY_VERT_HORZ;
            while (theWay && cellStart.y != this.activeCursor.y) {
                cellStart.y += yStep;
                if (!this.isRoadPathsEmptyVertical(cellStart)) {
                    theWay = false;
                }
            }
            if (!this.isRoadPathsEmptyHorizontal(cellStart)) {
                theWay = false; // corner check
            }
            while (theWay && cellStart.x != this.activeCursor.x) {
                cellStart.x += xStep;
                if (!this.isRoadPathsEmptyHorizontal(cellStart)) {
                    theWay = false;
                }
            }
        }

        if (theWay) { this.buildingRoad.way.auto = theWay; }
    }

    isWayPossible(theWay) {
        let cellStart : IPoss = { x: this.buildingRoad.start.x, y: this.buildingRoad.start.y };
        if (!this.canSetRoad(cellStart)) { return false; }

        let xStep = this.activeCursor.x > this.buildingRoad.start.x ? 1 : -1;
        let yStep = this.activeCursor.y > this.buildingRoad.start.y ? 1 : -1;

        if (CONF.BUILD_ROAD_WAY_HORZ_VERT == theWay) {
            while (cellStart.x != this.activeCursor.x) {
                cellStart.x += xStep;
                if (!this.canSetRoad(cellStart)) { return false; }
            }
            while (cellStart.y != this.activeCursor.y) {
                cellStart.y += yStep;
                if (!this.canSetRoad(cellStart)) { return false; }
            }
        }
        else if (CONF.BUILD_ROAD_WAY_VERT_HORZ == theWay) {
            while (cellStart.y != this.activeCursor.y) {
                cellStart.y += yStep;
                if (!this.canSetRoad(cellStart)) { return false; }
            }
            while (cellStart.x != this.activeCursor.x) {
                cellStart.x += xStep;
                if (!this.canSetRoad(cellStart)) { return false; }
            }
        }
        return true;
    }

    /** PATHs of road **/

    setPathsOnRoadByArr(updatePathsMode: boolean, replaceZonesMode: boolean, zones: Array<string>, preferType: CellRoadType | null, poss: IPoss) : RoadChangeHistory {
        let change: RoadChangeHistory = { prev: null, curr: null };
        if (zones.length < 2 && replaceZonesMode) { return change; }

        let wasCellEmpty = this.isCellEmpty(poss);
        let cell = this.getCellForRoad(poss);
        if (!cell) { return change; }

        let mergedZones = (replaceZonesMode || wasCellEmpty) ? [...zones] : this.mergeZones(zones, poss);

        if (!preferType ||
            (ROAD_LEFT_RIGHT == preferType && (!zones.includes(LEFT) || !zones.includes(RIGHT))) ||
            (ROAD_UP_DOWN == preferType && (!zones.includes(UP) || !zones.includes(DOWN))) ||
            (ROAD_HEAVY == preferType && 2 >= mergedZones.length))
        {
            preferType = ROAD_LIGHT;
        }

        if (mergedZones.length == 3) { preferType = ROAD_HEAVY; }
        if (ROAD_HEAVY != preferType && mergedZones.length == 4) { preferType = ROAD_LIGHT; }

        if (wasCellEmpty) {
            change = { prev: null, curr: preferType };
            cell.road.type = preferType;
        }
        else {
            if (cell.road.type == preferType && this.arePathsTheSame(cell.road.paths, this.zonesToRoadPaths(mergedZones, preferType == ROAD_HEAVY))) {
                return change;
            }
            change = { prev: cell.road.type, prevPaths: [...cell.road.paths.map((path) => { return !!path; })], curr: preferType };
        }

        cell.road.type = preferType;
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_LEFT, mergedZones.includes(LEFT), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_RIGHT, mergedZones.includes(RIGHT), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_UP, mergedZones.includes(UP), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_DOWN, mergedZones.includes(DOWN), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_HEAVY, ROAD_HEAVY == preferType, updatePathsMode);
        this.visibleUpdate(poss);
        return change;
    }

    setPathsOnRoad(updateMode, zoneFrom, zoneTo, preferType, poss: IPoss) {
        if (zoneFrom == CONF.OVER_CENTER || zoneTo == CONF.OVER_CENTER) { return { prev: null, curr: null }; }
        return this.setPathsOnRoadByArr(updateMode, false, [zoneFrom, zoneTo], preferType, poss);
    }
    setPathOnRoad(updateMode, zone, poss: IPoss) {
        if (zone == CONF.OVER_CENTER) { return { prev: null, curr: null }; }
        return this.setPathsOnRoadByArr(updateMode, false, [zone], ROAD_LIGHT, poss);
    }

    setPathsOnRoadByTap(poss: IPoss) : null | false | RoadChangeHistory {
        let wasCellEmpty = this.isCellEmpty(poss);
        let cell = this.getCellForRoad(poss);
        if (!cell) { return null; }

        if (cell.isEmptyAround) {
            if (wasCellEmpty) {
                return this.setPathsOnRoadByArr(false, true, [LEFT, RIGHT], ROAD_LIGHT, poss);
            }
            else if (!cell.road.paths[CONF.ROAD_PATH_UP] && cell.road.paths[CONF.ROAD_PATH_RIGHT] && !cell.road.paths[CONF.ROAD_PATH_DOWN] && cell.road.paths[CONF.ROAD_PATH_LEFT]) {
                return this.setPathsOnRoadByArr(false, true, [UP, DOWN], ROAD_LIGHT, poss);
            }
            return false;
        }

        if (ROAD_LIGHT == cell.road.type && cell.isSidesPathsAllExist) {
            return this.setPathsOnRoadByArr(false, false, [], ROAD_HEAVY, poss);
        }

        if (wasCellEmpty) {
            let sides: Array<string> = [];
            if (cell.isCellConnectedAtSide(UP)) { sides.push(UP); }
            if (cell.isCellConnectedAtSide(RIGHT)) { sides.push(RIGHT); }
            if (cell.isCellConnectedAtSide(DOWN)) { sides.push(DOWN); }
            if (cell.isCellConnectedAtSide(LEFT)) { sides.push(LEFT); }

            if (sides.length > 1) {
                return this.setPathsOnRoadByArr(false, true, sides, null, poss);
            }
            else if (sides.length == 1 && (sides[0] == UP || sides[0] == DOWN)) {
                return this.setPathsOnRoadByArr(false, true, [UP, DOWN], ROAD_LIGHT, poss);
            }
            else { return this.setPathsOnRoadByArr(false, true, [LEFT, RIGHT], ROAD_LIGHT, poss); }
        }
        return false;
    }

    updatePathsOnNeighborsRoads(poss: IPoss) {
        CONF.SIDES.map((toDir) => {
            // this.visibleUpdate(...this[toDir](poss));
        });
    }

    defineRoadPath(cell: ICellWithRoad, poss: IPoss, pathType: number, pathContent: boolean, updateMode: boolean = false) {
        if (!updateMode || !pathContent) {
            cell.road.paths[pathType] = pathContent;
            //this.cancelColorOnDefineRoadPath(poss, pathType);
        }
        else if (!cell.road.paths[pathType]) {
            cell.road.paths[pathType] = pathContent;
            //this.cancelColorOnDefineRoadPath(poss, pathType);
        }
    }

    /** SEMICONDUCTORs **/

    setColorToSemiconductorByRoad(color, fromDir, poss: IPoss) {}

    /** COLOR **/

    cancelColorOnRoadCell(checkRun: number | null, fromDir: DirSide, poss: IPoss) {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }
        let road = cell.road;

        if (!checkRun) {
            checkRun = this.checkRun;
        }
        else if (checkRun == road.checkRun) { return; }
        road.checkRun = checkRun;

        let toDir: DirSide = CONF.OPPOSITE_SIDE[fromDir];
        let fromPath = CONF.SIDE_TO_ROAD_PATH[fromDir];
        let oppositePath = CONF.SIDE_TO_ROAD_PATH[toDir];

        if (road.paths[fromPath]) {
            if (this.canPathCancelColor(road, fromPath)) {
                road.paths[fromPath] = true;
            }
            this.removeColoringCellCacheToDir(toDir, poss);
            this.removeColoringCellCacheToDir(fromDir, poss);
        }

        if (road.paths[oppositePath]) {
            if (this.canPathCancelColor(road, oppositePath)) {
                if (this.isColoredRoadFlowsOutToDirection(toDir, poss)) {
                    this.setColorToSemiconductorByRoad(null, fromDir, cell.cellPosition[toDir]);
                }
                road.paths[oppositePath] = true;
            }
            this.removeColoringCellCacheToDir(toDir, poss);
            this.removeColoringCellCacheToDir(fromDir, poss);
            this.cancelColorOnRoadCell(checkRun, fromDir, cell.cellPosition[toDir]);
        }

        if (this.canPathCancelColor(road, CONF.ROAD_PATH_HEAVY)) {
            road.paths[CONF.ROAD_PATH_HEAVY] = true;
        }

        let cellPosition = cell.cellPosition; // weird typeScript :(
        if (cell && road.paths[fromPath] && (!road.paths[oppositePath] || road.paths[CONF.ROAD_PATH_HEAVY]))
        {
            CONF.SIDES_TURN_90[fromDir].map((turnSide: DirSide) => {
                let turnPath = CONF.SIDE_TO_ROAD_PATH[turnSide];
                if (this.canPathCancelColor(road, turnPath)) {
                    if (this.isColoredRoadFlowsOutToDirection(turnSide, poss)) {
                        this.setColorToSemiconductorByRoad(null, CONF.OPPOSITE_SIDE[turnSide], cellPosition[turnSide]);
                    }
                    road.paths[turnPath] = true;
                }
                if (road.paths[turnPath]) {
                    this.removeColoringCellCacheToDir(turnPath, poss);
                    this.removeColoringCellCacheToDir(CONF.OPPOSITE_SIDE[turnSide], poss);
                    this.cancelColorOnRoadCell(checkRun, CONF.OPPOSITE_SIDE[turnSide], cellPosition[turnSide])
                }
            })
        }

        this.visibleUpdate(poss);
    }

    // cancelColorOnDefineRoadPath(poss: IPoss, pathType) {
    //     if (CONF.ROAD_PATH_TO_SIDE.hasOwnProperty(pathType)) {
    //         let toDir = CONF.ROAD_PATH_TO_SIDE[pathType];
    //         let toDirRoad = this.findCellOrEmpty(...this[toDir](poss)).road;
    //         if (toDirRoad && toDirRoad.paths[CONF.SIDE_TO_ROAD_PATH[CONF.OPPOSITE_SIDE[toDir]]]) {
    //             this.cancelColorOnRoadCell(null, CONF.OPPOSITE_SIDE[toDir], ...this[toDir](poss));
    //         }
    //     }
    // }

    setColorToRoad(color, fromDir: DirSide, poss: IPoss) {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }
        let road = cell.road;
        let pathFrom = CONF.SIDE_TO_ROAD_PATH[fromDir];

        if (color) {
            if (this.canPathSetColor(road, pathFrom)) {
                road.paths[pathFrom] = { color: color, from: fromDir };
                this.moveColorToNextPaths(
                    poss,
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

        this.visibleUpdate(poss);
    }

    disabledDirsToMoveColor(road: CellRoad, fromDir: DirSide) : Array<DirSide> {
        let disabled = [fromDir];
        if (ROAD_HEAVY != road.type && road.paths[CONF.SIDE_TO_ROAD_PATH[CONF.OPPOSITE_SIDE[fromDir]]]) {
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

    moveColorToNextPaths(poss: IPoss, color, disabledDirs: Array<DirSide>) {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }

        let cacheDirections: Array<DirSide> = [];
        SIDES.map((side) => {
            if (disabledDirs.includes(side)) { return; }
            cacheDirections.push(side);
        });

        this.coloringCellCache(poss).push({
            type: CONF.ST_ROAD,
            method: 'execMoveColorToNextPaths',
            params: [poss, color, disabledDirs],
            cacheDirections: cacheDirections,
        });
    }

    execMoveColorToNextPaths(poss: IPoss, color, disabledDirs) {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }
        let road = cell.road;

        let nextSides: Array<DirSide> = [];

        SIDES.map((toDir) => {
            if (disabledDirs.includes(toDir)) { return; }
            let pathTo = CONF.SIDE_TO_ROAD_PATH[toDir];
            if (this.canPathSetColor(road, pathTo)) {
                road.paths[pathTo] = { color: color, from: CONF.OPPOSITE_SIDE[toDir] };
                nextSides.push(toDir);
            }
        });
        this.visibleUpdate(poss);

        this.coloringCellCache(poss).push({
            type: CONF.ST_ROAD,
            method: 'moveColorToHeavy',
            params: [road, color, poss],
            cacheDirections: [...SIDES],
        });

        this.coloringCellCache(poss).push({
            type: CONF.ST_ROAD,
            method: 'moveColorToNextCells',
            params: [cell, nextSides, color],
            cacheDirections: nextSides,
        });
    }

    moveColorToHeavy(road, color, poss: IPoss) {
        if (this.canPathSetColor(road, CONF.ROAD_PATH_HEAVY)) {
            road.paths[CONF.ROAD_PATH_HEAVY] = { color: color };
            this.visibleUpdate(poss);
        }
    }

    moveColorToNextCells(cell: Cell, nextSides, color) {
        nextSides.map((toDir) => {
            this.setColorToRoad(color, CONF.OPPOSITE_SIDE[toDir], cell[toDir]);
            this.setColorToSemiconductorByRoad(color, CONF.OPPOSITE_SIDE[toDir], cell[toDir]);
        });
    }

}