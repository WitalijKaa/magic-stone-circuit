import * as CONF from "../config/game"
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {SchemeBase} from "./SchemeBase";
import {IPoss} from "./IPoss";
import {CellStone} from "./Types/CellStone";
import {CellRoad, CellRoadPathType, CellRoadType, RoadChangeHistory, RoadChangeHistoryCell} from "./Types/CellRoad";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {BuildRoadWays} from "./Types/BuildRoadWays";
import {GridZone} from "./Types/GridCursor";
import {DirSide} from "./Types/DirectionSide";
import {Cell} from "./Cell";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {HH} from "./HH";
import {CellScheme} from "./CellScheme";
import {CellSemiconductorDirection, CellSemiconductorType, SemiColor} from "./Types/CellSemiconductor";

export class Scheme extends SchemeBase {

    visibleUpdate(poss: IPoss) {
        this.visibleGrid.refreshVisibleCell(poss);
    }
    afterChange() {}

    /** STONEs **/

    putContent(type: CellStone, poss: IPoss) : void {
        let cell = this.getCellForContent(poss);
        if (!cell) { return; }

        if (cell.content != type) { this.cancelNeighborsColorPathForAnyRoad(poss); }
        cell.content = type;
        this.contentCells[this.cellName(poss)] = poss;
        this.visibleUpdate(poss);

        SIDES.map((side: DirSide) => {
            this.setAwakeColorSemiconductorByStone(CONF.STONE_TYPE_TO_ROAD_COLOR[type], HH[side](poss))
        });

        // if (this.coloringAwaitTick) {
        //     this.coloringCellCache(poss).push({
        //         type: CONF.ST_STONE_VIOLET,
        //         method: 'setColorAroundByStone',
        //         params: [poss],
        //         cacheDirections: [...CONF.SIDES],
        //     });
        // }

        this.afterChange();
    }

    removeContent(poss: IPoss) {
        let cell = this.findCellOfContent(poss);
        if (!cell) { return; }
        this.cancelNeighborsColorPathForAnyRoad(poss);
        SIDES.map((side: DirSide) => {
            this.setAwakeColorSemiconductorByStone(null, HH[side](poss))
        });
        delete(this.contentCells[this.cellName(poss)]);
        this.killCell(poss);

        this.visibleUpdate(poss);
        this.afterChange();
    }

    setColorAroundByStone(poss: IPoss) : void {
        let cell = this.findCellOfContent(poss);
        if (!cell) { return; }

        SIDES.map((sideTo: DirSide) => {
            this.setColorToRoad(CONF.STONE_TYPE_TO_ROAD_COLOR[cell!.content], CONF.OPPOSITE_SIDE[sideTo], cell!.cellPosition[sideTo])
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
        let cell = this.findCellOfRoad(poss);
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
        let cell = this.findCellOfRoad(poss);
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
        let cell = this.findCellOfRoad(poss);
        if (cell) {
            let mergedZones = this.mergeZones([UP, DOWN], poss);
            if (ROAD_HEAVY == cell.road.type || mergedZones.length == 3) {
                preferType = ROAD_HEAVY;
            }
        }

        return this.setPathsOnRoad(false, UP, DOWN, preferType, poss);
    }

    afterPutRoad(cell: ICellWithRoad) {
        this.removeColoringCellCache(cell);
        this.cancelNeighborsColorPathForAnyRoadByPaths(cell.road.paths, cell);
    }

    removeRoad(poss: IPoss) {
        if (!this.findCellOfRoad(poss)) { return; }

        this.cancelNeighborsColorPathForAnyRoad(poss);

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
                    let cell = this.getCellForRoadForced(roadCellMem.position);
                    cell.road.type = roadCellMem.change.prev;
                    cell.road.paths = roadCellMem.change.prevPaths;
                    this.visibleUpdate(roadCellMem.position);
                    this.afterPutRoad(cell);
                }
            }
        })
        this.buildingRoad.path = [];
    }

    doBuildRoad() {
        if (this.buildingRoad.start.x == this.activeCursor.x && this.buildingRoad.start.y == this.activeCursor.y) {
            return;
        }

        let cellMover : IPoss = { x: this.buildingRoad.start.x, y: this.buildingRoad.start.y };
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
                changeParams = isFirstHorizontal ? this.putRoadHorizontal(cellMover) : this.putRoadVertical(cellMover);
            }
            else {
                changeParams = this.putRoadZonal(this.buildingRoad.zoneStart, zoneTo, cellMover);
            }
            this.buildingRoad.path.push({ change: changeParams, position: this.iPossClone(cellMover)});

            while (cellMover.x != this.activeCursor.x) {
                cellMover.x += xStep;
                if (cellMover.x == this.activeCursor.x) // last horizontal cell
                {
                    let zoneFrom = xStep > 0 ? LEFT : RIGHT;

                    if (cellMover.y != this.activeCursor.y) { // turning cell
                        let zoneTo = yStep > 0 ? DOWN : UP;
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellMover), position: this.iPossClone(cellMover)});
                    }
                    else { // last cell of road logic when road is horizontal line
                        let zoneTo = this.activeCursor.zone;

                        if ((this.isCellEmpty(cellMover) && zoneFrom == zoneTo) || zoneTo == CONF.OVER_CENTER || zoneFrom == CONF.OPPOSITE_SIDE[zoneTo]) {
                            this.buildingRoad.path.push({ change: this.putRoadHorizontal(cellMover), position: this.iPossClone(cellMover)});
                        }
                        else if (zoneFrom == zoneTo) {
                            this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, cellMover), position: this.iPossClone(cellMover)});
                        }
                        else {
                            this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellMover), position: this.iPossClone(cellMover)});
                        }
                    }
                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadHorizontal(cellMover), position: this.iPossClone(cellMover)});
                }
            }
            while (cellMover.y != this.activeCursor.y) {
                cellMover.y += yStep;
                if (cellMover.y == this.activeCursor.y) { // last vertical cell of the road-with-corner logic
                    let zoneFrom = yStep > 0 ? UP : DOWN;
                    let zoneTo = this.activeCursor.zone;

                    if ((this.isCellEmpty(cellMover) && zoneFrom == zoneTo) || zoneTo == CONF.OVER_CENTER || zoneFrom == CONF.OPPOSITE_SIDE[zoneTo]) {
                        this.buildingRoad.path.push({ change: this.putRoadVertical(cellMover), position: this.iPossClone(cellMover)});
                    }
                    else if (zoneFrom == zoneTo) {
                        this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, cellMover), position: this.iPossClone(cellMover)});
                    }
                    else {
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellMover), position: this.iPossClone(cellMover)});
                    }
                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadVertical(cellMover), position: this.iPossClone(cellMover)});
                }
            }
        }
        else if (CONF.BUILD_ROAD_WAY_VERT_HORZ == this.buildRoadWay) {
            let zoneTo = yStep > 0 ? DOWN : UP;

            // first cell of road logic
            if (this.buildingRoad.zoneStart == CONF.OVER_CENTER || this.buildingRoad.zoneStart == zoneTo || this.buildingRoad.zoneStart == CONF.OPPOSITE_SIDE[zoneTo]) {
                this.buildingRoad.path.push({ change: this.putRoadVertical(cellMover), position: this.iPossClone(cellMover)});
            }
            else {
                this.buildingRoad.path.push({ change: this.putRoadZonal(this.buildingRoad.zoneStart, zoneTo, cellMover), position: this.iPossClone(cellMover)});
            }

            while (cellMover.y != this.activeCursor.y) {
                cellMover.y += yStep;
                if (cellMover.y == this.activeCursor.y) // last vertical cell
                {
                    let zoneFrom = yStep > 0 ? UP : DOWN;

                    if (cellMover.x != this.activeCursor.x) { // turning cell
                        zoneTo = xStep > 0 ? RIGHT : LEFT;
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellMover), position: this.iPossClone(cellMover)});
                    }
                    else { // last cell of road logic when road is vertical line
                        let zoneTo = this.activeCursor.zone;

                        if ((this.isCellEmpty(cellMover) && zoneFrom == zoneTo) || zoneTo == CONF.OVER_CENTER || zoneFrom == CONF.OPPOSITE_SIDE[zoneTo]) {
                            this.buildingRoad.path.push({ change: this.putRoadHorizontal(cellMover), position: this.iPossClone(cellMover)});
                        }
                        else if (zoneFrom == zoneTo) {
                            this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, cellMover), position: this.iPossClone(cellMover)});
                        }
                        else {
                            this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellMover), position: this.iPossClone(cellMover)});
                        }
                    }

                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadVertical(cellMover), position: this.iPossClone(cellMover)});
                }
            }
            while (cellMover.x != this.activeCursor.x) {
                cellMover.x += xStep;
                if (cellMover.x == this.activeCursor.x) { // last horizontal cell of the road-with-corner logic
                    let zoneFrom = xStep > 0 ? LEFT : RIGHT;
                    let zoneTo = this.activeCursor.zone;

                    if ((this.isCellEmpty(cellMover) && zoneFrom == zoneTo) || zoneTo == CONF.OVER_CENTER || zoneFrom == CONF.OPPOSITE_SIDE[zoneTo]) {
                        this.buildingRoad.path.push({ change: this.putRoadHorizontal(cellMover), position: this.iPossClone(cellMover)});
                    }
                    else if (zoneFrom == zoneTo) {
                        this.buildingRoad.path.push({ change: this.setPathOnRoad(false, zoneFrom, cellMover), position: this.iPossClone(cellMover)});
                    }
                    else {
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellMover), position: this.iPossClone(cellMover)});
                    }
                }
                else { // not first not last not turning
                    this.buildingRoad.path.push({ change: this.putRoadHorizontal(cellMover), position: this.iPossClone(cellMover)});
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
            if (cell.isCellConnectedAtSide(UP)) { sides.push(UP); } // todo use road func
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

    defineRoadPath(cell: ICellWithRoad, poss: IPoss, pathType: CellRoadPathType, pathContent: boolean, updateMode: boolean = false) {
        if (!updateMode || !pathContent) {
            cell.road.paths[pathType] = pathContent;
            this.cancelColorOnDefineRoadPath(poss, pathType);
        }
        else if (!cell.road.paths[pathType]) {
            cell.road.paths[pathType] = pathContent;
            this.cancelColorOnDefineRoadPath(poss, pathType);
        }
    }

    /** SEMICONDUCTORs **/

    private allowedAmountOfAwakesCluster: number = 2;

    putSemiconductor(scType: CellSemiconductorType | null, poss: IPoss) {
        if (!scType) {
            this.killCell(poss); // todo
            delete(this.contentCells[this.cellName(poss)]);
        }
        else if (CONF.ST_ROAD_SLEEP == scType) {
            this.putSleepSemiconductor(poss);
        }
        else if (CONF.ST_ROAD_AWAKE == scType) {
            this.putAwakeSemiconductor(poss);
        }
        this.visibleUpdate(poss);
        this.afterChange();
    }

    putSleepSemiconductor(poss: IPoss) : void {
        let cellModel = this.antiCell(poss);
        let cellSemi = this.findCellOfSemiconductor(poss);
        if (!cellSemi && !this.isCellEmpty(poss)) { return; }

        if (cellModel.isSemiconductorChargedAround || cellModel.isSemiconductorSleepAround) { return; }

        let direction: CellSemiconductorDirection = ROAD_LEFT_RIGHT;
        if (cellModel.isSemiconductorAwakeAround) {
            if (cellModel.isSemiconductorAwakeAtLeftOrAtRight) { direction = ROAD_LEFT_RIGHT; }
            else { direction = ROAD_UP_DOWN; }
        }
        else if (cellSemi) {
            if (cellSemi.isSleepSemiconductor) {
                direction = (ROAD_LEFT_RIGHT == cellSemi.semiconductor.direction ? ROAD_UP_DOWN : ROAD_LEFT_RIGHT);
            }
            else if (cellSemi.isAwakeSemiconductor) {
                if (!cellSemi.isAnyRoadAround || cellSemi.isAnyRoadLeftOrRight) {
                    direction = ROAD_LEFT_RIGHT;
                }
                else { direction = ROAD_UP_DOWN; }
            }
        }
        if (cellSemi) {
            cellSemi.semiconductor.direction = direction;
        }

        cellSemi = this.getCellForSemiconductorForced(poss, direction, CONF.ST_ROAD_SLEEP);
        this.contentCells[this.cellName(poss)] = poss;
        this.setColorToNewSemiconductor(cellSemi);
    }

    putAwakeSemiconductor(poss: IPoss) {
        if (!this.findCellOfSemiconductor(poss) && !this.isCellEmpty(poss)) { return; }

        let cellModel = this.antiCell(poss);

        if (cellModel.isSemiconductorChargedAround) {
            return;
        }

        let clusterFree = this.allowedAmountOfAwakesCluster - 1;
        SIDES.map((side) => {
            clusterFree -= cellModel.countAwakeClusterAtSide(null, side);
        })
        if (clusterFree >= 0) {
            let cellSemi = this.getCellForSemiconductorForced(poss, ROAD_HEAVY, CONF.ST_ROAD_AWAKE);
            this.setColorToNewSemiconductor(cellSemi);
            SIDES.map((side) => {
                if (this.turnSleepSemiconductorHere(side, poss)) {
                    this.visibleUpdate(HH[side](poss));
                    this.cancelNeighborsColorPathForAnyRoad(HH[side](poss));
                }
            })
        }
    }

    private setColorToNewSemiconductor(cell: ICellWithSemiconductor) : void {
        SIDES.map((side: DirSide) => {
            let cellSide: CellScheme | null = cell[side];
            if (!cellSide) { return; }

            if (cellSide.content) {
                setTimeout(() => {this.setAwakeColorSemiconductorByStone(CONF.STONE_TYPE_TO_ROAD_COLOR[cellSide!.content!], cellSide!.poss)}, CONF.NANO_MS);
            }

            if (cellSide.semiconductor && !cell.semiconductor.colorAwake && CONF.ST_ROAD_AWAKE == cellSide.semiconductor.type) {
                cell.semiconductor.colorAwake = cellSide.semiconductor.colorAwake;
            }
        })
    }

    setAwakeColorSemiconductorByStone(color: SemiColor, poss: IPoss) {
        let cell = this.findCellOfSemiconductor(poss);
        if (!cell || !cell.semiconductor || cell.semiconductor.colorAwake == color) { return; }
        let semi = cell.semiconductor;

        semi.colorAwake = color;
        if (!color || semi.colorCharge != semi.colorAwake) {
            if (semi.colorFlow) {
                cell.sidesOfSemiconductor.map((side: DirSide) => {
                    this.cancelColorFlowsOutRoadPathByDir(side, poss);
                });
            }
            semi.colorCharge = null;
            semi.colorFlow = null;
        }
        this.refreshSemiconductorByColoredRoadsFlowsIn(cell);
        this.visibleUpdate(poss);
        this.removeColoringCellCache(poss);

        if (cell.isAwakeSemiconductor) {
            SIDES.map((side: DirSide) => {
                if (cell!.isAwakeSemiconductorConnectedToAnyOtherSemiconductorAtSide(side)) {
                    this.setAwakeColorSemiconductorByStone(semi.colorAwake, HH[side](poss));
                }
            });
        }
    }

    refreshSemiconductorByColoredRoadsFlowsIn(cell: ICellWithSemiconductor) {
        cell.sidesOfSemiconductor.map((side: DirSide) => { // todo norm queue
            if (cell.colorOfConnectedColoredRoadAtSideThatFlowsHere(side)) {
                if (cell.isAwakeSemiconductor) {
                    setTimeout(() => {
                        this.setColorToSemiconductorByRoad(cell.colorOfConnectedColoredRoadAtSideThatFlowsHere(side), side, cell.poss);
                    }, CONF.NANO_MS);
                }
                else if (cell.isSleepSemiconductor) {
                    setTimeout(() => {
                        this.coloringCellCache(cell.poss).push({
                            type: CONF.ST_ROAD_SLEEP,
                            method: 'setColorToSemiconductorByRoad',
                            params: [cell.colorOfConnectedColoredRoadAtSideThatFlowsHere(side), side, cell.poss],
                            cacheDirections: [side],
                        });
                    }, CONF.NANO_MS * 10);
                }
            }
        });
    }

    setChargeColorToSemiconductorByAwake(color: SemiColor, poss: IPoss) {
        let cell = this.findCellOfSemiconductor(poss);
        if (!cell || cell.semiconductor.colorCharge == color || (color && cell.semiconductor.colorAwake != color)) { return; }
        let semi = cell.semiconductor;

        semi.colorCharge = color;
        if (!color) {
            if (CONF.ST_ROAD_SLEEP == semi.type && semi.colorFlow) {
                cell.sidesOfSemiconductor.map((toDir: DirSide) => {
                    this.cancelColorFlowsOutRoadPathByDir(toDir, poss);
                });
            }
            semi.colorFlow = null;
        }
        this.refreshSemiconductorByColoredRoadsFlowsIn(cell);
        this.visibleUpdate(poss);
        this.removeColoringCellCache(poss);

        if (cell.isAwakeSemiconductor) {
            SIDES.map((side: DirSide) => {
                if (cell!.isAwakeSemiconductorConnectedToAnyOtherSemiconductorAtSide(side)) {
                    this.setChargeColorToSemiconductorByAwake(color, HH[side](poss));
                }
            });
        }
    }

    setColorToSemiconductorByRoad(color: SemiColor, fromDir: DirSide, poss: IPoss) : void {
        let cell = this.findCellOfSemiconductor(poss);
        if (!cell) { return; }

        if (cell.isAwakeSemiconductor) {
            if (!color && this.hasTransistorTheSources(cell)) { return; }
            this.setChargeColorToSemiconductorByAwake(color, poss);
        }
        else if (cell.isSleepSemiconductor) {
            if (cell.semiconductor.direction == ROAD_LEFT_RIGHT) {
                if (LEFT != fromDir && RIGHT != fromDir) { return; }
            }
            else if (UP != fromDir && DOWN != fromDir) { return; }

            this.setColorToSemiconductorBySleep(color, fromDir, poss);
        }
    }

    hasTransistorTheSources(cell: ICellWithSemiconductor, checkRun: number | null = null) {
        if (!cell.isAwakeSemiconductor || !cell.semiconductor.colorCharge) { return false; }

        let exceptThisOne = false;
        if (!checkRun) {
            checkRun = this.checkRun;
            exceptThisOne = true;
        }
        if (cell.semiconductor.checkRun == checkRun) { return false; }
        cell.semiconductor.checkRun = checkRun;

        if (!exceptThisOne) {
            for (let ix = 0; ix < SIDES.length; ix++) {
                let fromDir = SIDES[ix];
                let sideCell = this.findCellOfRoad(HH[fromDir](cell));
                if (!sideCell) { continue; }
                let colorFlowsHere = cell.getColorOfPath(sideCell.road, CONF.OPPOSITE_SIDE[fromDir], fromDir);
                if (cell.semiconductor.colorCharge == colorFlowsHere) {
                    return true;
                }
            }
        }

        for (let ix = 0; ix < SIDES.length; ix++) {
            let sideCell = this.findCellOfSemiconductor(HH[SIDES[ix]](cell));
            if (!sideCell) { continue; }
            if (this.hasTransistorTheSources(sideCell, checkRun)) {
                return true;
            }
        }
    }

    setColorToSemiconductorBySleep(color: SemiColor, fromDir: DirSide, poss: IPoss): void {
        let cell = this.findCellOfSemiconductor(poss);
        if (!cell) { return; }
        let semi = cell.semiconductor;

        if (!cell.isSleepSemiconductor && !cell.isAwakeSemiconductor) { return; }
        if (!semi.colorCharge || semi.colorFlow == color || semi.colorCharge != semi.colorAwake) { return; }
        if (cell.isSleepSemiconductor && !HH.isSemiconductorCanBeConnectedToSide(cell, fromDir)) { return; }

        semi.colorFlow = color;
        semi.from = fromDir;
        this.visibleUpdate(poss);

        if (!color) {
            this.removeColoringCellCache(poss);
        }

        let sides = SIDES;
        if (cell.isSleepSemiconductor) { sides = [CONF.OPPOSITE_SIDE[fromDir]]; }

        sides.map((toDir: DirSide) => {
            let possSide = cell!.cellPosition[toDir];
            if (color) {
                this.coloringCellCache(possSide).push({
                    type: CONF.ST_ROAD_SLEEP,
                    method: 'setColorToSemiconductorBySleep',
                    params: [color, CONF.OPPOSITE_SIDE[toDir], possSide],
                    cacheDirections: [toDir],
                });
            }
            else {
                this.setColorToSemiconductorBySleep(color, CONF.OPPOSITE_SIDE[toDir], possSide);
            }
        });

        if (cell.isSleepSemiconductor) {
            let toDir = CONF.OPPOSITE_SIDE[semi.from];
            if (color) {
                this.coloringCellCache(poss).push({
                    type: CONF.ST_ROAD_SLEEP,
                    method: 'setColorAroundBySleep',
                    params: [true, cell.poss],
                    cacheDirections: [toDir],
                });
            }
            else {
                if (cell.isAnyRoadAtSides([toDir])) {
                    this.cancelColorOnRoadCell(null, semi.from, cell.cellPosition[toDir]);
                }
            }
        }
    }

    setColorAroundBySleep(forced: boolean, poss: IPoss) : void {
        let cell = this.findCellOfSemiconductor(poss);
        if (!cell || !cell.isSleepSemiconductor || (!forced && !cell.semiconductor.colorFlow) || !cell.semiconductor.from) { return; }

        let sideRoadCell = cell[CONF.OPPOSITE_SIDE[cell.semiconductor.from]];
        if (!sideRoadCell || !sideRoadCell.road) { return; }

        if (cell.semiconductor.colorFlow) {
            if (sideRoadCell.isUncoloredRoadPathFromSide(cell.semiconductor.from)) {
                this.setColorToRoad(cell.semiconductor.colorFlow, cell.semiconductor.from, sideRoadCell.poss);
            }
        }
        else {
            if (sideRoadCell.isRoadPathFromSide(cell.semiconductor.from)) {
                this.cancelColorOnRoadCell(null, cell.semiconductor.from, sideRoadCell.poss);
            }
        }
    }

    /** COLOR **/

    protected cancelColorOnRoadCell(checkRun: number | null, fromDir: DirSide, poss: IPoss) : void {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }
        let road = cell.road;

        if (!checkRun) {
            checkRun = this.checkRun;
        }
        else if (checkRun + 1 == road.checkRun) { return; }

        if (road.checkRun == checkRun) { road.checkRun = checkRun + 1; } // allow twice to cancel color on a cell
        else { road.checkRun = checkRun; }

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

    private cancelColorOnDefineRoadPath(poss: IPoss, pathType: CellRoadPathType) : void {
        if (CONF.ROAD_PATH_TO_SIDE.hasOwnProperty(pathType)) {
            let toDir: DirSide = CONF.ROAD_PATH_TO_SIDE[pathType];
            let sidePoss: IPoss = Cell[toDir](poss);
            let toDirCell = this.findCellOfRoad(sidePoss);
            if (toDirCell && toDirCell.road.paths[CONF.SIDE_TO_ROAD_PATH[CONF.OPPOSITE_SIDE[toDir]]]) {
                this.cancelColorOnRoadCell(null, CONF.OPPOSITE_SIDE[toDir], sidePoss);
            }
        }
    }

    setColorToRoad(color, fromDir: DirSide, poss: IPoss) {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }
        let pathFrom = CONF.SIDE_TO_ROAD_PATH[fromDir];

        if (color) {
            if (this.canPathSetColor(cell.road, pathFrom)) {
                cell.road.paths[pathFrom] = { color: color, from: fromDir };
                this.moveColorToNextPaths(
                    poss,
                    color,
                    this.disabledDirsToMoveColor(cell.road, fromDir)
                );
            }
        }
        else {
            if (cell.road.paths[pathFrom]) {
                cell.road.paths[pathFrom] = true;
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

    moveColorToNextCells(cell: ICellWithRoad, nextSides: Array<DirSide>, color: number) {
        nextSides.map((toDir: DirSide) => {
            this.setColorToRoad(color, CONF.OPPOSITE_SIDE[toDir], cell.cellPosition[toDir]);
            this.setColorToSemiconductorByRoad(color, CONF.OPPOSITE_SIDE[toDir], cell.cellPosition[toDir]);
        });
    }

}