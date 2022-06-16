import * as CONF from "../config/game"
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {SchemeBase} from "./SchemeBase";
import {IPoss} from "./IPoss";
import {CellStone} from "./Types/CellStone";
import {CellRoad, CellRoadPathType, CellRoadType, RoadChangeHistory, RoadChangeHistoryCell, RoadSavePathsArray} from "./Types/CellRoad";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {BuildRoadWays} from "./Types/BuildRoadWays";
import {GridZone} from "./Types/GridCursor";
import {DirSide} from "./Types/DirectionSide";
import {Cell} from "./Cell";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {HH} from "./HH";
import {CellScheme} from "./CellScheme";
import {CellSemiconductorDirection, CellSemiconductorType, SemiColor} from "./Types/CellSemiconductor";
import {Poss} from "./Poss";

export class Scheme extends SchemeBase {

    /** STONEs **/

    public putContent(type: CellStone, poss: IPoss) : void {
        let cell = this.getCellForContent(poss);
        if (!cell || cell.content == type) { return; }

        this.cancelColorPathsForAnyRoadAround(poss);
        cell.content = type;
        this.contentCells[this.cellName(poss)] = poss;
        this.setAwakeColorAroundForAwakeSemi(poss, type);

        this.refreshVisibleCell(poss);
        this.afterChange();

        // if (this.coloringAwaitTick) {
        //     this.coloringCellCache(poss).push({
        //         type: CONF.ST_STONE_VIOLET,
        //         method: 'setColorForRoadsAroundByStone',
        //         params: [poss],
        //         cacheDirections: [...CONF.SIDES],
        //     });
        // }
    }

    public removeContent(poss: IPoss) {
        let cell = this.findCellOfContent(poss);
        if (!cell) { return; }

        this.cancelColorPathsForAnyRoadAround(poss);
        this.setAwakeColorAroundForAwakeSemi(poss, null);
        delete(this.contentCells[this.cellName(poss)]);
        this.killCell(poss);

        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    protected setColorForRoadsAroundByStone(poss: IPoss) : void { // for update tick
        let cell = this.findCellOfContent(poss);
        if (!cell) { return; }

        SIDES.map((sideTo: DirSide) => {
            this.setColorToRoad(CONF.STONE_TYPE_TO_ROAD_COLOR[cell!.content], CONF.OPPOSITE_SIDE[sideTo], HH[sideTo](poss))
        });
    }

    protected setAwakeColorAroundForAwakeSemi(poss: IPoss, stoneColor: SemiColor) : void {
        SIDES.map((side: DirSide) => {
            this.setAwakeColorToSemiconductor(stoneColor ? CONF.STONE_TYPE_TO_ROAD_COLOR[stoneColor] : null, HH[side](poss), true);
        });
    }

    /** ROADs **/

    public putRoadSmart(poss: IPoss) {
        if (this.isRoadBuildMode) { return; }

        if (false === this.setPathsOnRoadByTap(poss)) {
            this.removeRoad(poss);
        }
        this.removeColoringCellCache(poss);
        this.afterChange();
    }

    public removeRoad(poss: IPoss) {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }

        this.cancelColorPathsRoadsAroundByPaths(cell.road.paths, poss);
        this.cancelSemiColorByRoadPaths(cell.road.paths, poss);

        this.killCell(poss);
        this.removeColoringCellCache(poss);
        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    private putRoadHorizontal(poss: IPoss) {
        return this.putRoadZonal(LEFT, RIGHT, poss, ROAD_LEFT_RIGHT);
    }

    private putRoadVertical(poss: IPoss) {
        return this.putRoadZonal(UP, DOWN, poss, ROAD_UP_DOWN);
    }
    
    private putRoadZonal(zoneFrom: DirSide, zoneTo: DirSide, poss: IPoss, preferType: CellRoadType = ROAD_LIGHT) {
        let cell = this.findCellOfRoad(poss);
        if (cell) {
            let mergedZones = this.zonesMergedWithRoadPathsAsDirSide([zoneFrom, zoneTo], poss);
            if (ROAD_HEAVY == cell.road.type ||
                (preferType == ROAD_LIGHT && mergedZones.length > 2) ||
                (preferType != ROAD_LIGHT && mergedZones.length == 3))
            {
                preferType = ROAD_HEAVY;
            }
        }
        return this.setPathsOnRoad(false, zoneFrom, zoneTo, preferType, poss);
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

    public changeBuildRoadWayFixed() : void {
        if (this.isRoadBuildMode) {
            this.buildingRoad.way.fixed = this.nextWayToBuildRoadByOrder;
        }
    }

    private get nextWayToBuildRoadByOrder() : BuildRoadWays {
        let prevWay: BuildRoadWays = !this.buildingRoad.way.fixed ? this.buildingRoad.way.auto : this.buildingRoad.way.fixed;
        return prevWay == CONF.BUILD_ROAD_WAY_HORZ_VERT ? CONF.BUILD_ROAD_WAY_VERT_HORZ : CONF.BUILD_ROAD_WAY_HORZ_VERT;
    }

    private get buildRoadWay() : BuildRoadWays {
        return this.buildingRoad.way.fixed ? this.buildingRoad.way.fixed : this.buildingRoad.way.auto;
    }

    public startToBuildRoad(poss: IPoss) : void {
        if (this.buildingRoad.isOn || poss.x != this.activeCursor.x || poss.y != this.activeCursor.y) { return; }

        this.buildingRoad.isOn = true;
        this.buildingRoad.start = this.iPossClone(poss);
        this.buildingRoad.zoneStart = this.buildingRoad.zonePainted = this.activeCursor.zone;
        this.buildingRoad.painted = this.iPossClone(poss);
        this.buildingRoad.path = [];
        this.buildingRoad.way = { auto: CONF.BUILD_ROAD_WAY_HORZ_VERT, fixed: null, last: null };
    }

    public finishToBuildRoad() : void {
        this.buildingRoad.isOn = false;
        this.afterChange();
    }

    protected buildRoadTick() : void {
        if (this.buildingRoad.painted.x != this.activeCursor.x ||
            this.buildingRoad.painted.y != this.activeCursor.y ||
            this.buildingRoad.zonePainted != this.activeCursor.zone ||
            this.buildingRoad.way.last != this.buildRoadWay
        ) {
            this.removePrevBuiltRoad();
            if (!this.buildingRoad.way.fixed) { this.redefineBuildRoadAutoWay(); }
            if (this.isWayPossible(this.buildRoadWay)) {
                this.doBuildRoad();
            }

            this.buildingRoad.way.last = this.buildRoadWay;
            this.buildingRoad.painted.x = this.activeCursor.x;
            this.buildingRoad.painted.y = this.activeCursor.y;
            this.buildingRoad.zonePainted = this.activeCursor.zone;
        }
    }

    private removePrevBuiltRoad() : void {
        this.buildingRoad.path.map((roadCellMem: RoadChangeHistoryCell) => {
            if (roadCellMem.change.curr) {
                if (!roadCellMem.change.prev) {
                    this.removeRoad(roadCellMem.position);
                }
                else if (roadCellMem.change.prevPaths) {
                    let cell = this.getCellForRoadForced(roadCellMem.position);
                    cell.road.type = roadCellMem.change.prev;
                    cell.road.paths = roadCellMem.change.prevPaths;
                    this.refreshVisibleCell(roadCellMem.position);
                    this.removeColoringCellCache(cell);
                }
            }
        })
        this.buildingRoad.path = [];
    }

    private doBuildRoad() : void {
        if (this.buildingRoad.start.x == this.activeCursor.x && this.buildingRoad.start.y == this.activeCursor.y) {
            return;
        }

        let cellMover : IPoss = { x: this.buildingRoad.start.x, y: this.buildingRoad.start.y };
        const { xStep, yStep } = this.findStepXY;

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
                    let zoneFrom: DirSide = xStep > 0 ? LEFT : RIGHT;

                    if (cellMover.y != this.activeCursor.y) { // turning cell
                        let zoneTo: DirSide = yStep > 0 ? DOWN : UP;
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellMover), position: this.iPossClone(cellMover)});
                    }
                    else { // last cell of road logic when road is horizontal line
                        let zoneTo: GridZone = this.activeCursor.zone;

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
                    let zoneFrom: DirSide = yStep > 0 ? UP : DOWN;
                    let zoneTo: GridZone = this.activeCursor.zone;

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
            let zoneTo: DirSide = yStep > 0 ? DOWN : UP;

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
                    let zoneFrom: DirSide = yStep > 0 ? UP : DOWN;

                    if (cellMover.x != this.activeCursor.x) { // turning cell
                        zoneTo = xStep > 0 ? RIGHT : LEFT;
                        this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, cellMover), position: this.iPossClone(cellMover)});
                    }
                    else { // last cell of road logic when road is vertical line
                        let zoneTo: GridZone = this.activeCursor.zone;

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
                    let zoneFrom: DirSide = xStep > 0 ? LEFT : RIGHT;
                    let zoneTo: GridZone = this.activeCursor.zone;

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

    private redefineBuildRoadAutoWay() : void {
        this.buildingRoad.way.auto = (!this.isBuildRoadPreferredWayHorzVert() && this.isBuildRoadPreferredWayVertHorz()) ?
            CONF.BUILD_ROAD_WAY_VERT_HORZ :
            CONF.BUILD_ROAD_WAY_HORZ_VERT;
    }

    private isBuildRoadPreferredWayHorzVert() : boolean {
        let theCell : IPoss = { x: this.buildingRoad.start.x, y: this.buildingRoad.start.y };
        const { xStep, yStep } = this.findStepXY;

        while (theCell.x != this.activeCursor.x) {
            theCell.x += xStep;
            if (!this.isRoadPathsEmptyHorizontal(theCell)) {
                return false;
            }
        }
        if (theCell.y != this.activeCursor.y && !this.isRoadPathsEmptyVertical(theCell)) {
            return false; // corner check
        }
        while (theCell.y != this.activeCursor.y) {
            theCell.y += yStep;
            if (!this.isRoadPathsEmptyVertical(theCell)) {
                return false;
            }
        }
        return true;
    }

    private isBuildRoadPreferredWayVertHorz() : boolean {
        if (this.activeCursor.x != this.buildingRoad.start.x && this.activeCursor.y != this.buildingRoad.start.y)
        {
            let theCell : IPoss = { x: this.buildingRoad.start.x, y: this.buildingRoad.start.y };
            const { xStep, yStep } = this.findStepXY;

            while (theCell.y != this.activeCursor.y) {
                theCell.y += yStep;
                if (!this.isRoadPathsEmptyVertical(theCell)) {
                    return false;
                }
            }
            if (!this.isRoadPathsEmptyHorizontal(theCell)) {
                return false; // corner check
            }
            while (theCell.x != this.activeCursor.x) {
                theCell.x += xStep;
                if (!this.isRoadPathsEmptyHorizontal(theCell)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    private isWayPossible(theWay) : boolean {
        let theCell : IPoss = { x: this.buildingRoad.start.x, y: this.buildingRoad.start.y };
        if (!this.isCellEmptyOrRoad(theCell)) { return false; }

        const step = this.findStepXY;
        let aAxis = 'x'; let bAxis = 'y';
        if (CONF.BUILD_ROAD_WAY_VERT_HORZ == theWay) {
            aAxis = 'y'; bAxis = 'x';
        }

        while (theCell[aAxis] != this.activeCursor[aAxis]) {
            theCell[aAxis] += step[aAxis + 'Step'];
            if (!this.isCellEmptyOrRoad(theCell)) { return false; }
        }
        while (theCell[bAxis] != this.activeCursor[bAxis]) {
            theCell[bAxis] += step[bAxis + 'Step'];
            if (!this.isCellEmptyOrRoad(theCell)) { return false; }
        }

        return true;
    }

    private get findStepXY() : { xStep: number, yStep: number } {
        return {
            xStep: this.activeCursor.x > this.buildingRoad.start.x ? 1 : -1,
            yStep: this.activeCursor.y > this.buildingRoad.start.y ? 1 : -1
        };
    }

    /** PATHs of road **/

    setPathsOnRoadByArr(updatePathsMode: boolean, replaceZonesMode: boolean, zones: Array<DirSide>, preferType: CellRoadType | null, poss: IPoss) : RoadChangeHistory {
        let change: RoadChangeHistory = { prev: null, curr: null };
        if (zones.length < 2 && replaceZonesMode) { return change; }

        let wasCellEmpty = this.isCellEmpty(poss);
        let cell = this.getCellForRoad(poss);
        if (!cell) { return change; }

        let mergedZones = (replaceZonesMode || wasCellEmpty) ? [...zones] : this.zonesMergedWithRoadPathsAsDirSide(zones, poss);

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
            change = {
                prev: cell.road.type,
                prevPaths: [...cell.road.paths.map((path) => { return !!path; })] as RoadSavePathsArray,
                curr: preferType
            };
        }

        cell.road.type = preferType;
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_LEFT, mergedZones.includes(LEFT), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_RIGHT, mergedZones.includes(RIGHT), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_UP, mergedZones.includes(UP), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_DOWN, mergedZones.includes(DOWN), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_HEAVY, ROAD_HEAVY == preferType, updatePathsMode);
        this.refreshVisibleCell(poss);
        return change;
    }

    private setPathsOnRoad(updateMode: boolean, zoneFrom: GridZone, zoneTo: GridZone, preferType: CellRoadType | null, poss: IPoss) : RoadChangeHistory {
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
            let sides: Array<DirSide> = [];
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
        this.refreshVisibleCell(poss);
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
                    this.refreshVisibleCell(HH[side](poss));
                    this.cancelColorPathsForAnyRoadAround(HH[side](poss));
                }
            })
        }
    }

    private setColorToNewSemiconductor(cell: ICellWithSemiconductor) : void {
        SIDES.map((side: DirSide) => {
            let cellSide: CellScheme | null = cell[side];
            if (!cellSide) { return; }

            if (cellSide.content) {
                setTimeout(() => { this.setAwakeColorToSemiconductor(CONF.STONE_TYPE_TO_ROAD_COLOR[cellSide!.content!], cellSide!.poss, true); }, CONF.NANO_MS);
            }

            if (cellSide.semiconductor && !cell.semiconductor.colorAwake && CONF.ST_ROAD_AWAKE == cellSide.semiconductor.type) {
                cell.semiconductor.colorAwake = cellSide.semiconductor.colorAwake;
            }
        })
    }

    private setAwakeColorToSemiconductor(color: SemiColor, poss: IPoss, onlyForAwakeType: boolean = false) {
        let cell = this.findCellOfSemiconductor(poss);
        if (!cell || (!cell.isAwakeSemiconductor && onlyForAwakeType) || cell.semiconductor.colorAwake == color) { return; }
        let semi = cell.semiconductor;

        semi.colorAwake = color;
        if (!color || semi.colorCharge != semi.colorAwake) {
            if (semi.colorFlow) {
                cell.sidesOfSemiconductor.map((side: DirSide) => {
                    this.cancelRoadColorFlowsOutPathBySide(side, poss);
                });
            }
            semi.colorCharge = null;
            semi.colorFlow = null;
        }
        this.refreshSemiconductorByColoredRoadsFlowsIn(cell);
        this.refreshVisibleCell(poss);
        this.removeColoringCellCache(poss);

        if (cell.isAwakeSemiconductor) {
            SIDES.map((side: DirSide) => {
                if (cell!.isAwakeSemiconductorConnectedToAnyOtherSemiconductorAtSide(side)) {
                    this.setAwakeColorToSemiconductor(semi.colorAwake, HH[side](poss));
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
                    this.cancelRoadColorFlowsOutPathBySide(toDir, poss);
                });
            }
            semi.colorFlow = null;
        }
        this.refreshSemiconductorByColoredRoadsFlowsIn(cell);
        this.refreshVisibleCell(poss);
        this.removeColoringCellCache(poss);

        if (cell.isAwakeSemiconductor) {
            SIDES.map((side: DirSide) => {
                if (cell!.isAwakeSemiconductorConnectedToAnyOtherSemiconductorAtSide(side)) {
                    this.setChargeColorToSemiconductorByAwake(color, HH[side](poss));
                }
            });
        }
    }

    protected setColorToSemiconductorByRoad(color: SemiColor, fromDir: DirSide, poss: IPoss) : void {
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
        this.refreshVisibleCell(poss);

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
                    this.cancelColorOnRoadFromSide(null, semi.from, cell.cellPosition[toDir]);
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
                this.cancelColorOnRoadFromSide(null, cell.semiconductor.from, sideRoadCell.poss);
            }
        }
    }

    /** COLOR **/

    protected cancelColorOnRoadFromSide(checkRun: number | null, fromDir: DirSide, poss: IPoss) : void {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }

        let road = cell.road;
        let fromPath: CellRoadPathType = CONF.SIDE_TO_ROAD_PATH[fromDir];
        if (!road.paths[fromPath]) { return; }

        let nextCheckRun = this.verifyThatCheckRunForRoadCancelColorIsOk(road, checkRun);
        if (false === nextCheckRun) { return; }

        let oppositeDir: DirSide = CONF.OPPOSITE_SIDE[fromDir];
        let oppositePath: CellRoadPathType = CONF.SIDE_TO_ROAD_PATH[oppositeDir];

        this.eraseColorOnRoadPath(road, fromPath);
        this.removeColoringCellCacheToDir(oppositeDir, poss);
        this.removeColoringCellCacheToDir(fromDir, poss);

        this.eraseColorOnSecondRoadPath(poss, road, oppositeDir, nextCheckRun);

        this.eraseColorOnRoadPath(road, CONF.ROAD_PATH_HEAVY);

        if (!road.paths[oppositePath] || road.paths[CONF.ROAD_PATH_HEAVY]) {
            CONF.SIDES_TURN_90[fromDir].map((turnDir: DirSide) => {
                this.eraseColorOnSecondRoadPath(poss, road, turnDir, nextCheckRun as number);
            })
        }

        this.refreshVisibleCell(poss);
    }

    private eraseColorOnSecondRoadPath(poss: IPoss, road: CellRoad, toDir: DirSide, nextCheckRun: number) : void {
        let pathType = CONF.SIDE_TO_ROAD_PATH[toDir];
        if (!road.paths[pathType]) { return; }

        let fromDir: DirSide = CONF.OPPOSITE_SIDE[toDir];
        let nextCellPoss: IPoss = HH[toDir](poss);

        if (this.isColoredRoadFlowsOutToDirection(toDir, poss)) {
            this.setColorToSemiconductorByRoad(null, fromDir, nextCellPoss);
        }
        this.eraseColorOnRoadPath(road, pathType);
        this.cancelColorOnRoadFromSide(nextCheckRun, fromDir, nextCellPoss);

        this.removeColoringCellCacheToDir(toDir, poss);
        this.removeColoringCellCacheToDir(fromDir, poss);
    }

    private cancelColorOnDefineRoadPath(poss: IPoss, pathType: CellRoadPathType) : void {
        if (CONF.ROAD_PATH_TO_SIDE.hasOwnProperty(pathType)) {
            let toDir: DirSide = CONF.ROAD_PATH_TO_SIDE[pathType];
            let sidePoss: IPoss = Cell[toDir](poss);
            let toDirCell = this.findCellOfRoad(sidePoss);
            if (toDirCell && toDirCell.road.paths[CONF.SIDE_TO_ROAD_PATH[CONF.OPPOSITE_SIDE[toDir]]]) {
                this.cancelColorOnRoadFromSide(null, CONF.OPPOSITE_SIDE[toDir], sidePoss);
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

        this.refreshVisibleCell(poss);
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
        this.refreshVisibleCell(poss);

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
            this.refreshVisibleCell(poss);
        }
    }

    moveColorToNextCells(cell: ICellWithRoad, nextSides: Array<DirSide>, color: number) {
        nextSides.map((toDir: DirSide) => {
            this.setColorToRoad(color, CONF.OPPOSITE_SIDE[toDir], cell.cellPosition[toDir]);
            this.setColorToSemiconductorByRoad(color, CONF.OPPOSITE_SIDE[toDir], cell.cellPosition[toDir]);
        });
    }

}