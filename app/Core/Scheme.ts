import * as CONF from "../config/game"
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {SchemeBase} from "./SchemeBase";
import {IPoss} from "./IPoss";
import {CellStone, CellStoneType} from "./Types/CellStone";
import {CellRoad, CellRoadPathType, CellRoadType, RoadChangeHistory, RoadChangeHistoryCell, RoadSavePathsArray} from "./Types/CellRoad";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {Axis, BuildRoadWays} from "./Types/BuildRoadWays";
import {GridZone} from "./Types/GridCursor";
import {DirSide} from "./Types/DirectionSide";
import {Cell} from "./Cell";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {HH} from "./HH";
import {CellScheme} from "./CellScheme";
import {CellSemiconductorDirection, CellSemiconductorType, SemiColor} from "./Types/CellSemiconductor";
import {Poss} from "./Poss";
import {SmileComponent} from "./Components/SmileComponent";
import {LevelComponent} from "./Components/LevelComponent";

export class Scheme extends SchemeBase {

    protected initComponents() {
        this.cSmile = new SmileComponent(this);
        this.cLevel = new LevelComponent(this);
    }

    public beforeAnyInput() {
        this.switcherMode = false;
    }

    cancelProcesses() : void {
        this.cancelToBuildRoad();
    }

    public setVisualCenter() : void {
        this.visibleGrid.setCenter();
    }

    /** STONEs **/

    public putContent(stoneType: CellStoneType, poss: IPoss) : void {
        if (stoneType && this.isDifferentAwakeColorsAround(poss, CONF.STONE_TYPE_TO_ROAD_COLOR[stoneType], true)) {
            return;
        }
        let cell = this.getCellForContent(poss);
        if (!cell || (cell.content && cell.content.type == stoneType)) { return; }

        this.cancelColorPathsForAnyRoadAround(poss);
        cell.content = { type: stoneType, range: this.switcherMode ? [...this.switcherMode] : [] };
        this.contentCells[this.cellName(poss)] = poss;
        this.setAwakeColorAroundForAwakeSemi(poss, stoneType);

        this.refreshVisibleCell(poss);
        this.afterChange();
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
            this.setColorToRoad(CONF.STONE_TYPE_TO_ROAD_COLOR[cell!.content.type], CONF.OPPOSITE_SIDE[sideTo], HH[sideTo](poss))
        });
    }

    protected setAwakeColorAroundForAwakeSemi(poss: IPoss, stoneType: CellStoneType | null) : void {
        SIDES.map((side: DirSide) => {
            this.setAwakeColorToSemiconductor(stoneType ? CONF.STONE_TYPE_TO_ROAD_COLOR[stoneType] : null, HH[side](poss), true);
        });
    }

    /** ROADs **/

    public putRoadSmart(poss: IPoss) {
        if (this.isRoadBuildMode || !this.inputAllowed) { return; }

        if (false === this.setSmartPathsForRoad(poss)) {
            this.removeRoad(poss);
        }
        this.removeColoringCellCache(poss);
        this.afterChange();
    }

    public removeRoad(poss: IPoss) {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }

        this.cancelColorPathsRoadsAroundByPaths(cell.road.paths, poss);
        this.cancelColorsAroundByRoadPaths(cell.road.paths, poss);

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
        this.buildingRoad.start = HH.clonePoss(poss);
        this.buildingRoad.zoneStart = this.buildingRoad.zonePainted = this.activeCursor.zone;
        this.buildingRoad.painted = HH.clonePoss(poss);
        this.buildingRoad.path = [];
        this.buildingRoad.way = { auto: CONF.BUILD_ROAD_WAY_HORZ_VERT, fixed: null, last: null };
    }

    public cancelToBuildRoad() {
        this.removePrevBuiltRoad();
        this.buildingRoad.isOn = false;
    }

    public finishToBuildRoad() : void {
        if (!this.buildingRoad.isOn) { return; }
        this.buildingRoad.path = [];
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
            if (this.isBuildRoadWayPossible(this.buildRoadWay)) {
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

        if (CONF.BUILD_ROAD_WAY_HORZ_VERT == this.buildRoadWay) {
            this.doBuildRoadHorzVert();
        }
        else if (CONF.BUILD_ROAD_WAY_VERT_HORZ == this.buildRoadWay) {
            this.doBuildRoadVertHorz();
        }
    }

    private putBuildRoadFirstCell(zoneTo: DirSide, isFirstHorizontal: boolean) : void {
        let poss: IPoss = this.buildingRoad.start;
        if (this.buildingRoad.zoneStart == CONF.OVER_CENTER || this.buildingRoad.zoneStart == zoneTo || this.buildingRoad.zoneStart == CONF.OPPOSITE_SIDE[zoneTo]) {
            this.buildingRoad.path.push({ change: (isFirstHorizontal ? this.putRoadHorizontal(poss) : this.putRoadVertical(poss)), position: HH.clonePoss(poss)});
        }
        else {
            this.buildingRoad.path.push({ change: this.putRoadZonal(this.buildingRoad.zoneStart, zoneTo, poss), position: HH.clonePoss(poss)});
        }
    }

    private putBuildRoadLine(axis: Axis, firstCell: IPoss, lastCell: IPoss) : void {
        let putPaths = (pathsPoss: IPoss) => {
            this.buildingRoad.path.push({
                change: ('x' == axis ? this.putRoadHorizontal(pathsPoss) : this.putRoadVertical(pathsPoss)),
                position: HH.clonePoss(pathsPoss)
            });
        }

        if (firstCell[axis] == lastCell[axis]) {
            putPaths(firstCell);
            return;
        }
        const step = this.findBuildRoadStepXY;
        if (firstCell[axis] + step[axis + 'Step'] * -1 == lastCell[axis]) {
            return;
        }
        const theCell: IPoss = HH.clonePoss(firstCell);
        while (theCell[axis] != lastCell[axis]) {
            putPaths(theCell);
            theCell[axis] += step[axis + 'Step'];
            if (theCell[axis] == lastCell[axis]) {
                putPaths(theCell);
            }
        }
    }

    private putBuildRoadLastCell(axis: Axis, zoneFrom: DirSide) : void {
        let poss: IPoss = this.activeCursor;
        let zoneTo: GridZone = this.activeCursor.zone;
        if ((this.isCellEmpty(poss) && zoneFrom == zoneTo) || zoneTo == CONF.OVER_CENTER || zoneFrom == CONF.OPPOSITE_SIDE[zoneTo]) {
            this.buildingRoad.path.push({
                change: ('x' == axis ? this.putRoadHorizontal(poss) : this.putRoadVertical(poss)),
                position: HH.clonePoss(poss)
            });
        }
        else if (zoneFrom == zoneTo) {
            this.buildingRoad.path.push({ change: this.setPathOnRoad(zoneFrom, poss), position: HH.clonePoss(poss)});
        }
        else {
            this.buildingRoad.path.push({ change: this.putRoadZonal(zoneFrom, zoneTo, poss), position: HH.clonePoss(poss)});
        }
    }
    
    private doBuildRoadHorzVert() : void {
        const { xStep, yStep } = this.findBuildRoadStepXY;
        const isFirstHorizontal = this.activeCursor.x != this.buildingRoad.start.x;

        let firstCellZoneTo : DirSide;
        if (isFirstHorizontal) { // even if road is only vertical we use this method (default method)
            firstCellZoneTo = xStep > 0 ? RIGHT : LEFT;
        }
        else {
            firstCellZoneTo = yStep > 0 ? DOWN : UP;
        }
        let turnOrEndPoss: Cell = Cell.Create(this.activeCursor.x, this.buildingRoad.start.y);
        let endPoss: Cell = Cell.Create(this.activeCursor.x, this.activeCursor.y);

        this.putBuildRoadFirstCell(firstCellZoneTo, isFirstHorizontal);

        if (this.buildingRoad.start.x != this.activeCursor.x) {
            if (RIGHT == firstCellZoneTo) {
                this.putBuildRoadLine('x', Cell.Right(this.buildingRoad.start), turnOrEndPoss.Left);
            }
            else if (LEFT == firstCellZoneTo) {
                this.putBuildRoadLine('x', Cell.Left(this.buildingRoad.start), turnOrEndPoss.Right);
            }
        }
        let nextXCellZoneFrom: DirSide = xStep > 0 ? LEFT : RIGHT;
        if (this.buildingRoad.start.y != this.activeCursor.y) { // turning cell
            let nextYCellZoneTo: DirSide = yStep > 0 ? DOWN : UP;
            if (this.buildingRoad.start.x != this.activeCursor.x) {
                this.buildingRoad.path.push({ change: this.putRoadZonal(nextXCellZoneFrom, nextYCellZoneTo, turnOrEndPoss), position: HH.clonePoss(turnOrEndPoss)});
            }
            if (DOWN == nextYCellZoneTo) {
                this.putBuildRoadLine('y', turnOrEndPoss.Down, endPoss.Up);
            }
            else if (UP == nextYCellZoneTo) {
                this.putBuildRoadLine('y', turnOrEndPoss.Up, endPoss.Down);
            }
            this.putBuildRoadLastCell('y', CONF.OPPOSITE_SIDE[nextYCellZoneTo])
        }
        else {
            this.putBuildRoadLastCell('x', nextXCellZoneFrom)
        }
    }

    private doBuildRoadVertHorz() : void {
        if (this.buildingRoad.start.y == this.activeCursor.y) {
            this.doBuildRoadHorzVert();
            return;
        }

        const { xStep, yStep } = this.findBuildRoadStepXY;
        let firstCellZoneTo: DirSide = yStep > 0 ? DOWN : UP;

        let turnOrEndPoss: Cell = Cell.Create(this.buildingRoad.start.x, this.activeCursor.y);
        let endPoss: Cell = Cell.Create(this.activeCursor.x, this.activeCursor.y);

        this.putBuildRoadFirstCell(firstCellZoneTo, false);

        if (DOWN == firstCellZoneTo) {
            this.putBuildRoadLine('y', Cell.Down(this.buildingRoad.start), turnOrEndPoss.Up);
        }
        else if (UP == firstCellZoneTo) {
            this.putBuildRoadLine('y', Cell.Up(this.buildingRoad.start), turnOrEndPoss.Down);
        }

        if (this.buildingRoad.start.x != this.activeCursor.x) { // turning cell
            let nextXCellZoneTo: DirSide = xStep > 0 ? RIGHT : LEFT;
            this.buildingRoad.path.push({ change: this.putRoadZonal(CONF.OPPOSITE_SIDE[firstCellZoneTo], nextXCellZoneTo, turnOrEndPoss), position: HH.clonePoss(turnOrEndPoss)});
            if (LEFT == nextXCellZoneTo) {
                this.putBuildRoadLine('x', turnOrEndPoss.Left, endPoss.Right);
            }
            else if (RIGHT == nextXCellZoneTo) {
                this.putBuildRoadLine('x', turnOrEndPoss.Right, endPoss.Left);
            }
            this.putBuildRoadLastCell('x', CONF.OPPOSITE_SIDE[nextXCellZoneTo])
        }
        else {
            this.putBuildRoadLastCell('y', CONF.OPPOSITE_SIDE[firstCellZoneTo])
        }
    }

    private redefineBuildRoadAutoWay() : void {
        this.buildingRoad.way.auto = (!this.isBuildRoadPreferredWayHorzVert() && this.isBuildRoadPreferredWayVertHorz()) ?
            CONF.BUILD_ROAD_WAY_VERT_HORZ :
            CONF.BUILD_ROAD_WAY_HORZ_VERT;
    }

    private isBuildRoadPreferredWayHorzVert() : boolean {
        const theCell : IPoss = HH.clonePoss(this.buildingRoad.start);
        const { xStep, yStep } = this.findBuildRoadStepXY;

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
            const theCell : IPoss = HH.clonePoss(this.buildingRoad.start);
            const { xStep, yStep } = this.findBuildRoadStepXY;

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

    private isBuildRoadWayPossible(theWay) : boolean {
        const theCell : IPoss = HH.clonePoss(this.buildingRoad.start);
        if (!this.isCellEmptyOrRoad(theCell)) { return false; }

        const step = this.findBuildRoadStepXY;
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

    private get findBuildRoadStepXY() : { xStep: number, yStep: number } {
        return {
            xStep: this.activeCursor.x > this.buildingRoad.start.x ? 1 : -1,
            yStep: this.activeCursor.y > this.buildingRoad.start.y ? 1 : -1
        };
    }

    /** PATHs of road **/

    private setPathsOnRoadByArr(updatePathsMode: boolean, replaceZonesMode: boolean, zones: Array<DirSide>, preferType: CellRoadType | null, poss: IPoss) : RoadChangeHistory {
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
    private setPathOnRoad(zone: GridZone, poss: IPoss) {
        if (zone == CONF.OVER_CENTER) { return { prev: null, curr: null }; }
        return this.setPathsOnRoadByArr(false, false, [zone], ROAD_LIGHT, poss);
    }

    private smartPathsLogicClickedPoss: null | IPoss = null;
    private setSmartPathsForRoad(poss: IPoss) : null | false | RoadChangeHistory {
        let wasCellEmpty = this.isCellEmpty(poss);
        let cell = this.getCellForRoad(poss);
        if (!cell) { return null; }

        let sides: Array<DirSide> = [];
        if (cell.isCellConnectedAtSide(UP)) { sides.push(UP); }
        if (cell.isCellConnectedAtSide(RIGHT)) { sides.push(RIGHT); }
        if (cell.isCellConnectedAtSide(DOWN)) { sides.push(DOWN); }
        if (cell.isCellConnectedAtSide(LEFT)) { sides.push(LEFT); }

        if (!sides.length) {
            if (wasCellEmpty) {
                return this.setPathsOnRoadByArr(false, true, [LEFT, RIGHT], ROAD_LIGHT, poss);
            }
            else if (!cell.road.paths[CONF.ROAD_PATH_UP] && cell.road.paths[CONF.ROAD_PATH_RIGHT] && !cell.road.paths[CONF.ROAD_PATH_DOWN] && cell.road.paths[CONF.ROAD_PATH_LEFT]) {
                return this.setPathsOnRoadByArr(false, true, [UP, DOWN], ROAD_LIGHT, poss);
            }
            return false;
        }

        if (wasCellEmpty) {
            if (sides.length == 1) {
                if (sides[0] == UP || sides[0] == DOWN) {
                    return this.setPathsOnRoadByArr(false, true, [UP, DOWN], ROAD_LIGHT, poss);
                }
                else { return this.setPathsOnRoadByArr(false, true, [LEFT, RIGHT], ROAD_LIGHT, poss); }
            }
            else {
                return this.setPathsOnRoadByArr(false, true, sides, null, poss);
            }
        }
        else {
            if (sides.length == 3) {
                let combos = this.cloneCombinations(CONF.PATHS_IF_THREE_AROUND_COMBINATIONS, sides);
                if (3 == cell.countSidePathsOnly) {
                    sides = combos.shift() as Array<DirSide>;
                }
                else if (2 == cell.countSidePathsOnly) {
                    let nextSides = this.findNextCombination(combos, this.roadPathsToZones(cell));
                    if (!nextSides) {
                        return false;
                    }
                    sides = nextSides;
                }
                else {
                    return false;
                }
                return this.setPathsOnRoadByArr(false, true, sides, ROAD_LIGHT, poss);
            }
            if (sides.length == 4) {
                if (ROAD_LIGHT == cell.road.type && cell.isAllSidesPathsExist) {
                    return this.setPathsOnRoadByArr(false, false, [], ROAD_HEAVY, poss);
                }
                else if (this.smartPathsLogicClickedPoss && cell.isAtPosition(this.smartPathsLogicClickedPoss)) {
                    if (4 == cell.countSidePathsOnly) {
                        sides = [...CONF.PATHS_IF_FOUR_AROUND_COMBINATIONS[0]];
                        return this.setPathsOnRoadByArr(false, true, sides, ROAD_HEAVY, poss);
                    }
                    else if (3 == cell.countSidePathsOnly) {
                        let nextSides = this.findNextCombination(CONF.PATHS_IF_FOUR_AROUND_COMBINATIONS, this.roadPathsToZones(cell));
                        if (!nextSides) {
                            sides = [...CONF.PATHS_IF_THREE_AROUND_COMBINATIONS[0]];
                            return this.setPathsOnRoadByArr(false, true, sides, ROAD_LIGHT, poss);
                        }
                        sides = nextSides;
                        return this.setPathsOnRoadByArr(false, true, sides, ROAD_HEAVY, poss);
                    }
                    else if (2 == cell.countSidePathsOnly) {
                        let nextSides = this.findNextCombination(CONF.PATHS_IF_THREE_AROUND_COMBINATIONS, this.roadPathsToZones(cell));
                        if (!nextSides) {
                            return false;
                        }
                        sides = nextSides;
                        return this.setPathsOnRoadByArr(false, true, sides, ROAD_LIGHT, poss);
                    }
                }

            }
        }

        if (4 == cell.countSidePathsOnly) {
            this.smartPathsLogicClickedPoss = cell.poss;
        }

        return false;
    }

    private defineRoadPath(cell: ICellWithRoad, poss: IPoss, pathType: CellRoadPathType, pathContent: boolean, updateMode: boolean = false): void {
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

    public putSemiconductor(scType: CellSemiconductorType | null, poss: IPoss) {
        if (!scType) {
            let cell = this.findCellOfSemiconductor(poss);
            // if (cell?.semiconductor.colorCharge) { return; }
            this.removeSemiconductor(cell);
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

    private removeSemiconductor(cell: ICellWithSemiconductor | null) : void {
        if (!cell) { return; }

        SIDES.map((side: DirSide) => {
            let sideCell = this.findCellOfSemiconductor(HH[side](cell));
            if (sideCell) {

                if (cell.isAwakeSemiconductor) {
                    if (sideCell.isAwakeSemiconductor && !this.hasTransistorTheAwakeSources(sideCell)) {
                        this.setAwakeColorToSemiconductor(null, sideCell, true);
                    }
                    else if (sideCell.isSleepSemiconductor) {
                        this.setAwakeColorToSemiconductor(null, sideCell, false);
                    }

                    this.setChargeColorToSemiconductorByAwake(null, HH[side](cell))
                }
                else if (cell.isSleepSemiconductor) {
                    this.setFlowColorToSemiconductor(null, CONF.OPPOSITE_SIDE[side], HH[side](cell));
                }
            }
        });

        this.killCell(cell);
        delete(this.contentCells[this.cellName(cell)]);
    }

    private putSleepSemiconductor(poss: IPoss) : void {
        let cellSemi = this.findCellOfSemiconductor(poss);
        if (!cellSemi && !this.isCellEmpty(poss)) { return; }
        if (this.isSemiconductorChargedAround(poss) || this.isSemiconductorSleepAround(poss)) { return; }

        let direction: CellSemiconductorDirection = ROAD_LEFT_RIGHT;
        if (this.isSemiconductorAwakeAround(poss)) {
            if (!this.isSemiconductorAwakeAtLeftOrAtRight(poss)) { direction = ROAD_UP_DOWN; }
        }
        else if (cellSemi) {
            if (cellSemi.isSleepSemiconductor) {
                direction = (ROAD_LEFT_RIGHT == cellSemi.semiconductor.direction ? ROAD_UP_DOWN : ROAD_LEFT_RIGHT);
            }
        }
        else if (this.isAnyRoadAround(poss) && !this.isAnyRoadLeftOrRight(poss)) {
            direction = ROAD_UP_DOWN;
        }

        cellSemi = this.getCellForSemiconductorForced(poss, direction, CONF.ST_ROAD_SLEEP);
        this.contentCells[this.cellName(poss)] = poss;
        this.setColorToNewSemiconductor(cellSemi);
    }

    private putAwakeSemiconductor(poss: IPoss) : void {
        if (this.isDifferentAwakeColorsAround(poss)) { return; }
        let cell = this.findCellOfSemiconductor(poss);
        if (!cell && !this.isCellEmpty(poss)) { return; }
        if (this.isSemiconductorChargedAround(poss) || this.isSemiconductorAwakeAroundDiagonal(poss)) { return; }

        let clusterFree = this.allowedAmountOfAwakesCluster - 1;
        SIDES.map((side) => {
            clusterFree -= this.countAwakeClusterAtSide(poss, null, side);
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
                this.setAwakeColorToSemiconductor(CONF.STONE_TYPE_TO_ROAD_COLOR[cellSide!.content!.type], cell, false);
            }

            if (!cell.semiconductor.colorAwake && cellSide.isAwakeSemiconductor && cellSide.semiconductor!.colorAwake) {
                this.setAwakeColorToSemiconductor(cellSide.semiconductor!.colorAwake, cell, false);
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

    private refreshSemiconductorByColoredRoadsFlowsIn(cell: ICellWithSemiconductor) {
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

    private setChargeColorToSemiconductorByAwake(color: SemiColor, poss: IPoss) {
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
            if (!color && this.hasTransistorTheChargeSources(cell)) { return; }
            this.setChargeColorToSemiconductorByAwake(color, poss);
        }
        else if (cell.isSleepSemiconductor) {
            if (cell.semiconductor.direction == ROAD_LEFT_RIGHT) {
                if (LEFT != fromDir && RIGHT != fromDir) { return; }
            }
            else if (UP != fromDir && DOWN != fromDir) { return; }

            this.setFlowColorToSemiconductor(color, fromDir, poss);
        }
    }

    private hasTransistorTheChargeSources(cell: ICellWithSemiconductor, checkRun: number | null = null) {
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
            if (this.hasTransistorTheChargeSources(sideCell, checkRun)) {
                return true;
            }
        }
    }

    private hasTransistorTheAwakeSources(cell: ICellWithSemiconductor) : boolean {
        for (let ix = 0; ix < SIDES.length; ix++) {
            if (this.findCellOfContent(HH[SIDES[ix]](cell))) {
                return true; // works only for transistor with 1 awake semiconductors
            }
        }
        return false;
    }

    private setFlowColorToSemiconductor(color: SemiColor, fromDir: DirSide, poss: IPoss): void {
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
                    method: 'setFlowColorToSemiconductor',
                    params: [color, CONF.OPPOSITE_SIDE[toDir], possSide],
                    cacheDirections: [toDir],
                });
            }
            else {
                this.setFlowColorToSemiconductor(color, CONF.OPPOSITE_SIDE[toDir], possSide);
            }
        });

        if (cell.isSleepSemiconductor) {
            let toDir = CONF.OPPOSITE_SIDE[semi.from];
            if (color) {
                this.coloringCellCache(poss).push({
                    type: CONF.ST_ROAD_SLEEP,
                    method: 'setColorToRoadBySleepSemiconductor',
                    params: [true, cell.poss],
                    cacheDirections: [toDir],
                });
            }
            else {
                if (this.isAnyRoadAtSides(cell, [toDir])) {
                    this.cancelColorOnRoadFromSide(null, semi.from, cell.cellPosition[toDir]);
                }
            }
        }
    }

    private setColorToRoadBySleepSemiconductor(forced: boolean, poss: IPoss) : void {
        let cell = this.findCellOfSemiconductor(poss);
        if (!cell || !cell.isSleepSemiconductor || (!forced && !cell.semiconductor.colorFlow) || !cell.semiconductor.from) { return; }

        let sideRoadCell = this.findCellOfRoad(HH[CONF.OPPOSITE_SIDE[cell.semiconductor.from]](poss));
        if (!sideRoadCell) { return; }

        if (cell.semiconductor.colorFlow) {
            if (sideRoadCell.isUncoloredRoadPathFromSide(cell.semiconductor.from)) {
                this.setColorToRoad(cell.semiconductor.colorFlow, cell.semiconductor.from, sideRoadCell.poss);
            }
            // else if (sideRoadCell.isRoadPathFromSide(cell.semiconductor.from)) {
            //     let colorFlowsOut = sideRoadCell.getColorOfPath(sideRoadCell.road, cell.semiconductor.from, cell.semiconductor.from);
            //     if (!colorFlowsOut || colorFlowsOut != cell.semiconductor.colorFlow) {
            //         this.cancelColorOnRoadFromSide(null, cell.semiconductor.from, sideRoadCell.poss);
            //         this.setColorToRoad(cell.semiconductor.colorFlow, cell.semiconductor.from, sideRoadCell.poss);
            //     }
            // }
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
            this.cSmile.setColorToSmileByRoad(null, fromDir, nextCellPoss);
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
            this.cSmile.setColorToSmileByRoad(color, CONF.OPPOSITE_SIDE[toDir], cell.cellPosition[toDir]);
        });
    }

    /** TRICKs **/

    public anyClick(poss: IPoss) : void {
        let cell = this.findCellOfContent(poss);
        if (!cell || !cell.content.range.length) { return; }
        let ix = cell.content.range.indexOf(cell.content.type);
        if (ix == -1) { return; }

        this.cancelColorPathsForAnyRoadAround(poss);
        this.setAwakeColorAroundForAwakeSemi(poss, null);
        cell.content.type = cell.content.range[(ix == cell.content.range.length - 1) ? 0 : ix + 1];
        this.setAwakeColorAroundForAwakeSemi(poss, cell.content.type);

        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    private switcherMode: false | Array<CellStoneType> = false;

    public setVioletSwitcher() : void {
        this.switcherMode = [CONF.ST_STONE_VIOLET, CONF.ST_STONE_RED];
    }
    public setIndigoSwitcher() : void {
        this.switcherMode = [CONF.ST_STONE_INDIGO, CONF.ST_STONE_ORANGE];
    }

    public putSmile(logic: string = 'True') : void { this.cSmile.putSmile(logic); }
}