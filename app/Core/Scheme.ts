import * as CONF from "../config/game"
import {SIDES, UP, RIGHT, DOWN, LEFT, ROAD_PATH_HEAVY} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {SchemeBase} from "./SchemeBase";
import {IPoss} from "./IPoss";
import {CellStoneType} from "./Types/CellStone";
import { CellRoad, CellRoadPathType, CellRoadType, RoadChangeHistory, RoadChangeHistoryCell, RoadSavePathsArray, RoadPathsArray } from "./Types/CellRoad";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {Axis, BuildRoadWays} from "./Types/BuildRoadWays";
import {GridZone} from "./Types/GridCursor";
import {DirSide} from "./Types/DirectionSide";
import {Cell} from "./Cell";
import {HH} from "./HH";
import {CellSemiconductorType} from "./Types/CellSemiconductor";
import {SmileComponent} from "./Components/SmileComponent";
import {LevelComponent} from "./Components/LevelComponent";
import {TriggerComponent} from "./Components/TriggerComponent";
import {ContentColor} from "./Types/ColorTypes";
import {SpeedComponent} from "./Components/SpeedComponent";
import {RoadComponent} from "./Components/RoadComponent";
import {ICellScheme} from "./Interfaces/ICellScheme";
import {PatternComponent} from "./Components/PatternComponent";
import {SchemeCopy, SchemeCopyCell} from "./Types/Scheme";
import {StoneComponent} from "./Components/StoneComponent";
import {SemiconductorComponent} from "./Components/SemiconductorComponent";
import {DeleteComponent} from "./Components/DeleteComponent";
import {UpdateComponent} from "./Components/UpdateComponent";
import {SwitcherComponent} from "./Components/SwitcherComponent";
import {ColorCellCache} from "./Types/ColorCellCache";

export class Scheme extends SchemeBase {

    public beforeAnyInput() { this.switcherMode = false; } // todo kill

    public cancelProcesses() : void {
        this.cancelToBuildRoad();
        this.cPattern.cancelCreate();
        this.cPattern.hideGhosts();
        this.cDelete.cancelFrame();
    }

    public isActionAlphaOn() : boolean {
        return this.isRoadBuildMode ||
            !this.inputAllowed ||
            this.cPattern.isActionCreateOn ||
            this.cPattern.isActionPutOn ||
            this.cDelete.isActionOn;
    }

    public actionAlphaTick() : boolean {
        if (this.isRoadBuildMode) {
            this.buildRoadTick();
            return true;
        }
        else if (this.cPattern.isActionCreateOn) {
            this.cPattern.update(this.activeCursor);
            return true;
        }
        else if (this.cPattern.showGhosts(this.activeCursor)) { return true; }
        else if (this.cDelete.updateFrame(this.activeCursor)) { return true; }
        return false;
    }

    public get isLevelMode() : boolean { return this.cLevel.isLevelMode; }

    /** BORDERs **/

    public getBorderType(poss: IPoss) : null | boolean {
        let border = this.cPattern.cellBorderType(poss);
        if (null === border) { border = this.cDelete.cellBorderType(poss); }
        return border;
    }

    /** TAPs **/

    private tapCell(poss: IPoss) : void {
        this.tapSwitcher(poss);
    }

    /** DELETEs **/

    public removeCell(poss: IPoss) : void {
        this.removeStone(poss);
        this.removeRoad(poss);
        this.removeSemiconductor(poss);
        this.removeTrigger(poss);
        this.removeSpeed(poss);
    }

    public actionDelete(poss: IPoss) : void {
        if (!this.cDelete.isActionOn) {
            this.cDelete.createFrame(poss);
        }
        else {
            this.cDelete.frameDelete();
        }
    }

    /** STONEs **/

    public putStone(stoneType: CellStoneType, poss: IPoss) : void {
        if (this.cStone.put(stoneType, poss)) {
            this.cSemi.update(poss);
        }
        this.tapCell(poss);
    }

    public removeStone(poss: IPoss) : void {
        if (this.cStone.remove(poss)) {
            this.cSemi.update(poss);
        }
    }

    public colorItAroundByStone(poss: IPoss) : void { this.cStone.colorItAround(poss); }

    /** SEMICONDUCTORs **/

    public putSemiconductor(scType: CellSemiconductorType, poss: IPoss) : void { this.cSemi.put(scType, poss); this.tapCell(poss); }
    private removeSemiconductor(poss: IPoss) : void { this.cSemi.remove(poss); }
    protected moveFlowColorToSemiconductorBySemiconductor(color: number, fromDir: DirSide, poss: IPoss) { this.cSemi.colorItFlowBySemiconductor(color, fromDir, poss); }
    public eraseSemiconductorColorByRoad(fromDir: DirSide, poss: IPoss) { this.cSemi.eraseItByRoad(fromDir, poss); }

    public colorItAroundBySleepSemiconductor(poss: IPoss) {
        let cell = this.findCellOfSemiconductor(poss);
        if (!cell || !cell.isSleepSemiconductor || !cell.semiconductor.colorCharge) { return; }
        if (cell.semiconductor.colorFlow && cell.isCellConnectedToUncoloredRoadAtSide(CONF.OPPOSITE_SIDE[cell.semiconductor.from!])) {
            this.setColorToRoad(cell.semiconductor.colorFlow, cell.semiconductor.from!, HH[CONF.OPPOSITE_SIDE[cell.semiconductor.from!]](poss));
        }
        if (cell.semiconductor.colorFlow) {
            if (cell.isCellConnectedToUncoloredRoadAtSide(CONF.OPPOSITE_SIDE[cell.semiconductor.from!])) {
                this.setColorToRoad(cell.semiconductor.colorFlow, cell.semiconductor.from!, HH[CONF.OPPOSITE_SIDE[cell.semiconductor.from!]](poss));
            }
            else { // kostil
                let toCell = this.findCellOfSemiconductor(HH[CONF.OPPOSITE_SIDE[cell.semiconductor.from!]](cell));
                if (toCell && !toCell.semiconductor.colorFlow) {
                    this.cacheColorAdd(toCell.poss, {
                        type: CONF.ST_ROAD_SLEEP,
                        method: 'moveFlowColorToSemiconductorBySemiconductor',
                        params: [cell.semiconductor.colorFlow, cell.semiconductor.from!, toCell.poss],
                        cacheDirections: SIDES,
                    });
                }
            }
        }
        else {
            let semiColorFromRoad = this.cSemi.findColorForSleepSemiconductorFlowsFromRoad(cell);
            if (semiColorFromRoad) {
                this.cSemi.colorItByRoad(semiColorFromRoad.color, semiColorFromRoad.fromDir, poss);
            }
        }
    }

    /** ROADs **/

    public eraseColorOnRoadPathFromSide(checkRun: number | null, fromDir: DirSide, poss: IPoss) : void {
        this.cRoad.eraseColorOnRoadPathFromSide(checkRun, fromDir, poss);
    }

    /** SPEEDers **/
    public putSpeed(poss: IPoss) { this.cSpeed.put(poss); this.tapCell(poss); }
    private removeSpeed(poss: IPoss) { this.cSpeed.delete(poss); }
    public eraseSpeedColorByRoad(fromDir: DirSide, poss: IPoss) { this.cSpeed.colorIt(null, fromDir, poss); }
    public colorItAroundBySpeed(poss: IPoss) { this.cSpeed.colorItAround(poss); }

    /** TRIGGERs **/
    public putTrigger(poss: IPoss) { this.cTrigger.put(poss); this.tapCell(poss); }
    public removeTrigger(poss: IPoss) { this.cTrigger.delete(poss); }
    public colorItAroundByTrigger(poss: IPoss) { this.cTrigger.colorItAround(poss); }

    /** SWITCHERs **/
    public tapSwitcher(poss: IPoss) { this.cSwither.tap(poss); }
    public colorItAroundBySwitcher(poss: IPoss) : void { this.cSwither.colorItAround(poss); }

    /** SMILEs **/

    public eraseSmileColorByRoad(fromDir: DirSide, poss: IPoss) { this.cSmile.setColorToSmileByRoad(null, fromDir, poss); }

    /** PATTERNs **/

    public putPattern() : void { this.cPattern.put(); }
    public cancelPutPattern() : void { this.cPattern.cancelCreate(); }
    public createPattern(poss: IPoss) : void { this.cPattern.create(poss); }
    public loadPattern(patternCopy: SchemeCopy) : void { this.cPattern.patternLoaded = patternCopy; this.cPattern.showGhosts(this.activeCursor); }
    public hidePattern() : void { this.cPattern.hideGhosts(); }
    public findGhost(poss: IPoss) : null | SchemeCopyCell { return this.cPattern.findGhost(poss); }

    public turnPatternByClock() : void { this.cPattern.turnPatternByClock(); }
    public turnPatternAntiClock() : void { this.cPattern.turnPatternAntiClock(); }

    /** ROADs **/

    public putRoadSmart(poss: IPoss) {
        if (this.isActionAlphaOn()) { return; }

        if (false === this.setSmartPathsForRoad(poss)) {
            this.removeRoad(poss);
        }
        this.cacheColorRemove(poss);
        this.afterChange();
    }

    public removeRoad(poss: IPoss) {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }

        this.killCell(poss);
        this.cacheColorRemove(poss);

        this.cRoad.eraseColorsAroundByPaths(cell.road.paths, poss);
        this.cancelColorsAroundForMagicObjs(cell);

        this.afterChange();
        this.refreshVisibleCell(poss);
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
        this.buildingRoad.path.forEach((roadCellMem: RoadChangeHistoryCell) => {
            if (roadCellMem.change.curr) {
                if (!roadCellMem.change.prev) {
                    this.removeRoad(roadCellMem.position);
                }
                else if (roadCellMem.change.prevPaths) {
                    let cell = this.getCellForRoadForced(roadCellMem.position);
                    cell.road.type = roadCellMem.change.prev;
                    cell.road.paths = roadCellMem.change.prevPaths;
                    this.refreshVisibleCell(roadCellMem.position);
                    this.cacheColorRemove(cell);
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
        if (!updateMode || !pathContent || !cell.road.paths[pathType]) {
            cell.road.paths[pathType] = pathContent;
            this.cancelColorOnDefineRoadPath(poss, pathType);
        }
    }

    /** COLOR **/

    public setColorToRoad(color: number, fromDir: DirSide, poss: IPoss) {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return; }
        let pathFrom = CONF.SIDE_TO_ROAD_PATH[fromDir];

        if (this.canPathSetColor(cell.road, pathFrom, fromDir)) {
            cell.road.paths[pathFrom] = { color: color, from: fromDir };
            this.moveColorToNextPaths(cell, color, this.findNextPathsToSetColor(cell.road, pathFrom));
        }
        this.refreshVisibleCell(poss);
    }

    private findNextPathsToSetColor(road: CellRoad, pathFrom: number) : Array<number> {
        let pathsIXs : Array<number> = [];
        if (true === road.paths[ROAD_PATH_HEAVY]) {
            pathsIXs.push(ROAD_PATH_HEAVY);
            if (pathFrom != 0 && true === road.paths[0]) { pathsIXs.push(0); }
            if (pathFrom != 1 && true === road.paths[1]) { pathsIXs.push(1); }
            if (pathFrom != 2 && true === road.paths[2]) { pathsIXs.push(2); }
            if (pathFrom != 3 && true === road.paths[3]) { pathsIXs.push(3); }
        }
        else if (!road.paths[4]) {
            let oppositePath = CONF.SIDE_TO_ROAD_PATH[CONF.OPPOSITE_SIDE[CONF.ROAD_PATH_TO_SIDE[pathFrom]]];
            if (true === road.paths[oppositePath]) { pathsIXs.push(oppositePath); }
            else if (!road.paths[oppositePath]) {
                let sides = CONF.SIDES_TURN_90[CONF.ROAD_PATH_TO_SIDE[pathFrom]];
                if (true === road.paths[CONF.SIDE_TO_ROAD_PATH[sides[0]]]) { pathsIXs.push(CONF.SIDE_TO_ROAD_PATH[sides[0]]); }
                if (true === road.paths[CONF.SIDE_TO_ROAD_PATH[sides[1]]]) { pathsIXs.push(CONF.SIDE_TO_ROAD_PATH[sides[1]]); }
            }
        }
        return pathsIXs;
    }

    private moveColorToNextPaths(cell: ICellWithRoad, color: number, paths: Array<number>) {
        paths.forEach((path) => {
            this.cacheColorAdd(cell.poss, {
                type: CONF.ST_ROAD,
                method: 'execMoveColorToNextPath',
                params: [cell.poss, color, path],
                cacheDirections: ROAD_PATH_HEAVY == path ? SIDES : [CONF.ROAD_PATH_TO_SIDE[path], CONF.OPPOSITE_SIDE[CONF.ROAD_PATH_TO_SIDE[path]]],
            });
        });
    }

    public execMoveColorToNextPath(poss: IPoss, color: number, path: CellRoadPathType) {
        let cell = this.findCellOfRoad(poss);
        if (!cell || !this.canPathSetColor(cell.road, path, CONF.OPPOSITE_SIDE[CONF.ROAD_PATH_TO_SIDE[path]])) { return; }

        if (ROAD_PATH_HEAVY == path) {
            cell.road.paths[path] = { color: color, from: LEFT };
            this.refreshVisibleCell(poss);
            return;
        }

        cell.road.paths[path] = { color: color, from: CONF.OPPOSITE_SIDE[CONF.ROAD_PATH_TO_SIDE[path]] };
        this.refreshVisibleCell(poss);

        this.cacheColorAdd(poss, {
            type: CONF.ST_ROAD,
            method: 'moveColorToNextCellByRoad',
            params: [HH[CONF.ROAD_PATH_TO_SIDE[path]](poss), CONF.OPPOSITE_SIDE[CONF.ROAD_PATH_TO_SIDE[path]], color],
            cacheDirections: [CONF.ROAD_PATH_TO_SIDE[path], CONF.OPPOSITE_SIDE[CONF.ROAD_PATH_TO_SIDE[path]]],
        });
    }

    public moveColorToNextCellByRoad(poss: IPoss, fromDir: DirSide, color: number) {
        this.setColorToRoad(color, fromDir, poss);
        this.setColorToMagicObjByRoad(color, fromDir, poss)
    }

    public setColorToMagicObjByRoad(color: ContentColor, fromDir: DirSide, poss: IPoss) {
        this.cSemi.colorItByRoad(color, fromDir, poss);
        this.cTrigger.colorIt(color, fromDir, poss);
        this.cSpeed.colorIt(color, fromDir, poss);
        this.cSmile.setColorToSmileByRoad(color, fromDir, poss);
    }

    public transferColorToNextCellsExceptToRoadByCache(cell: ICellScheme, nextSides: Array<DirSide>, color: number) {
        this.cacheColorAdd(cell, {
            type: CONF.ST_SPEED,
            method: 'transferColorToNextCellsExceptToRoadByCacheExec',
            params: [cell, nextSides, color],
            cacheDirections: nextSides,
        });
    }

    public transferColorToNextCellsExceptToRoadByCacheExec(cell: ICellScheme, nextSides: Array<DirSide>, color: number) {
        nextSides.forEach((toDir: DirSide) => {
            this.setColorToMagicObjByRoad(color, CONF.OPPOSITE_SIDE[toDir], cell.cellPosition[toDir])
        });
    }

    private cancelColorOnDefineRoadPath(poss: IPoss, pathType: CellRoadPathType) : void {
        if (CONF.ROAD_PATH_TO_SIDE.hasOwnProperty(pathType)) {
            let toDir: DirSide = CONF.ROAD_PATH_TO_SIDE[pathType];
            let sidePoss: IPoss = HH[toDir](poss);
            let toDirCell = this.findCellOfRoad(sidePoss);
            if (toDirCell && toDirCell.road.paths[CONF.SIDE_TO_ROAD_PATH[CONF.OPPOSITE_SIDE[toDir]]]) {
                this.eraseColorOnRoadPathFromSide(null, CONF.OPPOSITE_SIDE[toDir], sidePoss);
            }
            this.setColorToMagicObjByRoad(null, CONF.OPPOSITE_SIDE[toDir], sidePoss)
        }
    }

    protected cancelColorsAroundForMagicObjs(cell: ICellWithRoad) : void {
        SIDES.forEach((toDir: DirSide) => {
            if (this.isColoredRoadCellFlowsOutToDirection(cell, toDir)) {
                this.setColorToMagicObjByRoad(null, CONF.OPPOSITE_SIDE[toDir], HH[toDir](cell))
            }
        });
    }

    /** TRICKs **/

    private switcherMode: false | Array<CellStoneType> = false;

    public setVioletSwitcher() : void {
        this.switcherMode = [CONF.ST_STONE_VIOLET, CONF.ST_STONE_RED];
    }
    public setIndigoSwitcher() : void {
        this.switcherMode = [CONF.ST_STONE_INDIGO, CONF.ST_STONE_ORANGE];
    }

    public putSmile(logic: string = 'True') : void { this.cSmile.putSmile(logic); }

    public scaleIncrease() { this.visibleGrid.changeScale(-1); }
    public scaleDecrease() { this.visibleGrid.changeScale(1); }

    public setVisualCenter() : void { this.visibleGrid.setCenter(); }

    public cacheColorAdd(poss: IPoss, cache: ColorCellCache) : void { this.cUpdate.cacheAddAct(poss, cache); }
    public cacheColorRemove(poss: IPoss) : void { this.cUpdate.cacheRemoveAct(poss); }
    public cacheColorToDirRemove(toDir: DirSide, poss: IPoss) : void { this.cUpdate.cacheRemoveActOfColorToDir(toDir, poss); }

    protected initComponents() {
        this.cUpdate = new UpdateComponent(this);
        this.cDelete = new DeleteComponent(this);
        this.cPattern = new PatternComponent(this);
        this.cSwither = new SwitcherComponent(this);
        this.cSmile = new SmileComponent(this);
        this.cLevel = new LevelComponent(this);
        this.cRoad = new RoadComponent(this);
        this.cStone = new StoneComponent(this);
        this.cSemi = new SemiconductorComponent(this);
        this.cTrigger = new TriggerComponent(this);
        this.cSpeed = new SpeedComponent(this);
    }
}