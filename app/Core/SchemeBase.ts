import * as CONF from "../config/game";
import {SIDES, UP, RIGHT, DOWN, LEFT, SIDES_TURN_90} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {ROAD_PATH_UP, ROAD_PATH_RIGHT, ROAD_PATH_DOWN, ROAD_PATH_LEFT, ROAD_PATH_HEAVY} from "../config/game"
import {CellScheme} from "./CellScheme";
import {SchemeGrid} from "../Models/Scheme/SchemeGrid";
import {GridCursor} from "./Types/GridCursor";
import {IPoss} from "./IPoss";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {CellPath, CellRoad, CellRoadPathType, CellRoadType, RoadPathsArray, RoadSavePathsArray} from "./Types/CellRoad";
import {HH} from "./HH";
import {ColorCellCache} from "./Types/ColorCellCache";
import {DirSide} from "./Types/DirectionSide";
import {ICellWithContent} from "./Interfaces/ICellWithContent";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {CellSemiconductorDirection, CellSemiconductorType} from "./Types/CellSemiconductor";
import {CellStone, CellStoneType} from "./Types/CellStone";
import {SchemeCopy, SchemeInstanceStructure} from "./Types/Scheme";
import {IVisibleGrid} from "./Interfaces/IVisibleGrid";
import {Cell} from "./Cell";
import {SmileComponent} from "./Components/SmileComponent";
import {LevelComponent} from "./Components/LevelComponent";
import {ICellWithTrigger} from "./Interfaces/ICellWithTrigger";
import {TriggerComponent} from "./Components/TriggerComponent";
import {ContentColor} from "./Types/ColorTypes";
import {SpeedComponent} from "./Components/SpeedComponent";
import {StoneComponent} from "./Components/StoneComponent";
import {ICellWithSpeed} from "./Interfaces/ICellWithSpeed";
import {PatternComponent} from "./Components/PatternComponent";
import {DeleteComponent} from "./Components/DeleteComponent";
import {UpdateComponent} from "./Components/UpdateComponent";

const ROAD_DEV_PATH = {
    [ROAD_PATH_UP]: 'UP',
    [ROAD_PATH_RIGHT]: 'RIGHT',
    [ROAD_PATH_DOWN]: 'DOWN',
    [ROAD_PATH_LEFT]: 'LEFT',
    [ROAD_PATH_HEAVY]: 'CENTER',
}
const ROAD_DEV = {
    [ROAD_LIGHT]: 'LIGHT',
    [ROAD_HEAVY]: 'HEAVY',
    [ROAD_LEFT_RIGHT]: 'LEFT_RIGHT',
    [ROAD_UP_DOWN]: 'UP_DOWN',
}
const COLOR_DEV = {
    [CONF.COLOR_VIOLET_ROAD]: 'Vio',
    [CONF.COLOR_RED_ROAD]: 'Red',
    [CONF.COLOR_INDIGO_ROAD]: 'Ind',
    [CONF.COLOR_ORANGE_ROAD]: 'Ora',
}

export abstract class SchemeBase {

    protected cUpdate!: UpdateComponent;
    protected cDelete!: DeleteComponent;
    protected cPattern!: PatternComponent;
    protected cSmile!: SmileComponent;
    protected cLevel!: LevelComponent;
    protected cStone!: StoneComponent;
    protected cTrigger!: TriggerComponent;
    protected cSpeed!: SpeedComponent;

    scheme: SchemeInstanceStructure = {};
    visibleGrid!: IVisibleGrid;

    activeCursor: GridCursor = { x: 0, y: 0, zone: CONF.OVER_CENTER }

    private _checkRun: number = 1;
    public get checkRun() : number { return ++this._checkRun; }

    init(grid: SchemeGrid) : void {
        this.visibleGrid = grid;
        this.initComponents();
        this.updatePauseLastMoment = HH.timestamp();
    }

    public refreshVisibleCell(poss: IPoss) {
        this.visibleGrid.refreshCell(poss);
    }

    private _saveToStorageCallback: () => void = () => {};
    public setSaveToStorageMethod(saveCallable: () => void) : void { this._saveToStorageCallback = saveCallable; }

    private _savePatternCallback: (name: string, pattern: SchemeCopy) => void = () => {};
    public setSavePatternMethod(saveCallable: (name: string, pattern: SchemeCopy) => void) : void { this._savePatternCallback = saveCallable; }
    public savePattern(name: string, pattern: SchemeCopy) { return this._savePatternCallback(name, pattern); }

    public afterChange() : void { this._saveToStorageCallback(); }

    public resetScheme() : SchemeInstanceStructure {
        this.scheme = {};
        this.contentCells = {};
        this.cUpdate.cacheReset();
        this.visibleGrid.refreshAllCells();
        return this.scheme;
    }

    public loadScheme(source: SchemeCopy, xOffset: number = 800000000 - 100, yOffset: number = 800000000 - 100) {
        this.cLevel.isLevelMode = false;
        let toAwake: Array<[IPoss, CellStoneType]> = [];
        for (let row in source) {
            for (let column in source[row]) {
                let schemeCell = source[row][column];
                if (!schemeCell) { continue; }
                let poss = { x: +row + xOffset, y: +column + yOffset };

                if ('r' in schemeCell) {
                    let paths = [...CONF.ALL_PATHS_EMPTY] as RoadSavePathsArray;
                    schemeCell.r.p.split('').map((ix) => {
                        paths[+ix] = true;
                    })
                    this.getCellForRoadForced(poss, schemeCell.r.t, paths);
                    this.removeContentCell(poss);
                }
                else if ('s' in schemeCell) {
                    this.getCellForSemiconductorForced(poss, schemeCell.s.d, schemeCell.s.t);
                    if (CONF.ST_ROAD_SLEEP == schemeCell.s.t) {
                        this.setContentCell(poss);
                    }
                    else { this.removeContentCell(poss); }
                }
                else if ('c' in schemeCell) {
                    let range = [] as Array<CellStoneType>;
                    // if (schemeCell.c.r) {
                    //     range = schemeCell.c.r;
                    // }
                    this.getCellForStoneForced(poss, { type: schemeCell.c.t /*, range: range */ });
                    this.setContentCell(poss);
                    toAwake.push([poss, schemeCell.c.t])
                }
                else if ('t' in schemeCell) {
                    this.placeCellTriggerForced(poss);
                    this.setContentCell(poss);
                }
                else if ('f' in schemeCell) {
                    this.placeCellSpeedForced(poss, schemeCell.f.t);
                    this.setContentCell(poss);
                }
                else if ('i' in schemeCell) {
                    this._devCell = Cell.clonePoss(poss).Left;
                    this.putSmile(schemeCell.i.l);
                    this.removeContentCell(poss);
                }
            }
        }
        toAwake.map((params) => { this.setAwakeColorAroundForAwakeSemi(...params); });
        this.visibleGrid.refreshAllCells();
    }

    public levelMode(code: string) : void {
        this.cLevel.levelMode(code);
    }

    public checkLevel() : void {
        this.cLevel.checkLevel();
    }

    public get inputAllowed() : boolean {
        return this.cLevel.inputAllowed;
    }

    public get sizeRadius() : number { return 800000000; }

    // LIFE CYCLE

    public contentCells: { [key: string]: IPoss } = {};
    public setContentCell(poss: IPoss) { this.contentCells[this.cellName(poss)] = poss; }
    public removeContentCell(poss: IPoss) { delete(this.contentCells[this.cellName(poss)]); }

    public updateTickInit() : void { this.cUpdate.update(); }
    public speedUp() : void { this.cUpdate.speedUp(); }
    public speedDown() : void { this.cUpdate.speedDown(); }

    // ABSTRACT

    public abstract get isGameBlock() : boolean;
    protected abstract initComponents() : void;
    protected abstract actionAlphaTick() : boolean;
    protected abstract eraseColorOnRoadPathFromSide(checkRun: number | null, fromDir: DirSide, poss: IPoss): void;
    protected abstract setAwakeColorAroundForAwakeSemi(poss: IPoss, stoneColor: CellStoneType | null) : void;
    public abstract putSmile(logic: string) : void;

    public abstract cacheColorAdd(poss: IPoss, cache: ColorCellCache) : void;
    public abstract cacheColorRemove(poss: IPoss) : void;
    public abstract cacheColorToDirRemove(toDir: DirSide, poss: IPoss) : void;

    // UPDATE pause

    private updatePauseLength: number = 2;
    private updatePauseLastMoment: number = 0;
    private updatePauseEventsArr: Array<() => void> = [];

    public addRoadColoringFinalHandler(callback: () => void) : void {
        this.updatePauseLastMoment = HH.timestamp() + 5;
        this.updatePauseEventsArr.push(callback);
    }

    protected roadColoringFinalHandler() : void {
        if (this.updatePauseEventsArr.length && HH.timestamp() - this.updatePauseLastMoment > this.updatePauseLength) {
            this.updatePauseEventsArr.map((callback) => { callback(); });
            this.updatePauseEventsArr = [];
        }
    }

    // CELL

    public isCellEmpty(poss: IPoss) : boolean {
        return !this.scheme[poss.x] || !this.scheme[poss.x][poss.y]
    }

    public static initCellAsEmpty(model: CellScheme) : void {
        model.content = null;
        model.road = null;
        model.semiconductor = null;
        model.trigger = null;
        model.speed = null;
        model.smile = null;
    }

    protected getCellForContent(poss: IPoss) : null | CellScheme {
        return this.getCellFor('content', poss);
    }
    public getCellForStone(poss: IPoss) : null | CellScheme {
        return this.getCellFor('content', poss);
    }
    public getCellForNewStone(poss: IPoss, stone: CellStone) : null | CellScheme {
        let cell = this.getCellFor('content', poss);
        if (!cell) { return null; }
        cell.content = stone;
        return cell;
    }
    protected getCellForStoneForced(poss: IPoss, stone: CellStone) {
        let model = this.getCell(poss);
        SchemeBase.initCellAsStone(model, stone);
        return model as ICellWithContent;
    }
    public findCellOfContent(poss: IPoss) : null | ICellWithContent {
        return this.findCellOf('content', poss) as null | ICellWithContent;
    }
    public findCellOfStone(poss: IPoss) : null | ICellWithContent {
        return this.findCellOf('content', poss) as null | ICellWithContent;
    }
    public static initCellAsStone(model: CellScheme, stone: CellStone) : void {
        SchemeBase.initCellAsEmpty(model);
        model.content = stone;
    }

    protected getCellForRoad(poss: IPoss) : null | ICellWithRoad {
        let model = this.getCellFor('road', poss) as null | ICellWithRoad;
        if (model && !model.road) {
            model.road = { type: ROAD_LIGHT, paths: [...CONF.ALL_PATHS_EMPTY], checkRun: [0, 0, 0, 0, 0] };
        }
        return model;
    }
    protected getCellForRoadForced(poss: IPoss, type: CellRoadType = ROAD_LIGHT, paths: RoadPathsArray = [...CONF.ALL_PATHS_EMPTY]) : ICellWithRoad {
        let model = this.getCell(poss);
        SchemeBase.initCellAsRoad(model, type, paths);
        return model as ICellWithRoad;
    }
    public findCellOfRoad(poss: IPoss) : null | ICellWithRoad {
        return this.findCellOf('road', poss) as null | ICellWithRoad;
    }
    public static initCellAsRoad(model: CellScheme, type: CellRoadType = ROAD_LIGHT, paths: RoadPathsArray = [...CONF.ALL_PATHS_EMPTY]) : void {
        SchemeBase.initCellAsEmpty(model);
        model.road = { type: type, paths: paths, checkRun: [0, 0, 0, 0, 0] };
    }

    protected getCellForSemiconductorForced(poss: IPoss, dir: CellSemiconductorDirection, type: CellSemiconductorType) : ICellWithSemiconductor {
        let model = this.getCell(poss);
        SchemeBase.initCellAsSemiconductor(model, dir, type);
        return model as ICellWithSemiconductor;
    }
    public findCellOfSemiconductor(poss: IPoss) : null | ICellWithSemiconductor {
        return this.findCellOf('semiconductor', poss) as null | ICellWithSemiconductor;
    }
    public static initCellAsSemiconductor(model: CellScheme, dir: CellSemiconductorDirection, type: CellSemiconductorType) : void {
        SchemeBase.initCellAsEmpty(model);
        model.semiconductor = { direction: dir, type: type, colorAwake: null, colorFlow: null, colorCharge: null, from: null, checkRun: 0 };
    }

    private placeCellTriggerForced(poss: IPoss) : void { SchemeBase.initCellAsTrigger(this.getCell(poss)); }
    public createCellForTrigger(poss: IPoss) : boolean {
        let cell = this.getCellForTrigger(poss);
        if (cell) {
            SchemeBase.initCellAsTrigger(cell);
            return true;
        }
        return false;
    }
    private getCellForTrigger(poss: IPoss) : null | CellScheme {
        return this.getCellFor('trigger', poss);
    }
    public findCellOfTrigger(poss: IPoss) : null | ICellWithTrigger {
        return this.findCellOf('trigger', poss) as null | ICellWithTrigger;
    }
    public static initCellAsTrigger(model: CellScheme) : void {
        SchemeBase.initCellAsEmpty(model);
        model.trigger = { color: null };
    }

    private placeCellSpeedForced(poss: IPoss, toSide: DirSide) : void { SchemeBase.initCellAsSpeed(this.getCell(poss), toSide); }
    public createCellForSpeed(poss: IPoss, toSide: DirSide) : boolean {
        let cell = this.getCellForSpeed(poss);
        if (cell) {
            SchemeBase.initCellAsSpeed(cell, toSide);
            return true;
        }
        return false;
    }
    private getCellForSpeed(poss: IPoss) : null | CellScheme {
        return this.getCellFor('speed', poss);
    }
    public findCellOfSpeed(poss: IPoss) : null | ICellWithSpeed {
        return this.findCellOf('speed', poss) as null | ICellWithSpeed;
    }
    public static initCellAsSpeed(model: CellScheme, toSide: DirSide) : void {
        SchemeBase.initCellAsEmpty(model);
        model.speed = { to: toSide, color: null };
    }

    private getCellFor(field: CellContentField, poss: IPoss) : null | CellScheme {
        if (!this.isCellEmpty(poss)) {
            let schemeCell = this.getCell(poss);
            if (schemeCell[field]) { return schemeCell; }
            return null;
        }
        return this.getCell(poss)
    }

    private findCellOf(field: CellContentField, poss: IPoss) : null | CellScheme {
        if (!this.isCellEmpty(poss)) {
            let schemeCell = this.getCell(poss);
            if (schemeCell[field]) { return schemeCell; }
        }
        return null;
    }

    public findCell(poss: IPoss) : null | CellScheme {
        if (this.isCellEmpty(poss)) { return null; }
        return this.scheme[poss.x][poss.y] as CellScheme;
    }

    public getCell(poss: IPoss) : CellScheme {
        if (!this.scheme[poss.x] || !this.scheme[poss.x][poss.y]) {
            return this.createCell(poss);
        }
        return this.scheme[poss.x][poss.y] as CellScheme;
    }

    public killCell(poss: IPoss) : void {
        if (this.scheme[poss.x] && this.scheme[poss.x][poss.y]) {
            delete this.scheme[poss.x][poss.y];
        }
    }

    private createCell(poss: IPoss) : CellScheme {
        let cellScheme = new CellScheme(poss.x, poss.y, this);

        if (!this.scheme[poss.x]) { this.scheme[poss.x] = {}; }
        this.scheme[poss.x][poss.y] = cellScheme;

        return cellScheme;
    }

    protected cellName (poss: IPoss) : string { return poss.x + '|' + poss.y; }

    public possEquals(possA: IPoss, possB: IPoss) : boolean {
        return possA.x == possB.x && possA.y == possB.y;
    }

    // CURSOR

    setActiveCursorPosition(zone, x, y) : void {
        this.activeCursor.x = x;
        this.activeCursor.y = y;
        this.activeCursor.zone = zone;
    }

    // ZONES

    protected zonesToRoadPaths(zones: Array<string>, isHeavy: boolean) : Array<boolean> {
        let paths = [false, false, false, false, isHeavy];
        zones.map((zone) => { paths[CONF.SIDE_TO_ROAD_PATH[zone]] = true; });
        return paths;
    }

    protected zonesMergedWithRoadPathsAsDirSide(zones: Array<DirSide>, poss: IPoss) : Array<DirSide> {
        let resultZones = [...zones];
        let zonesOfPaths = this.roadPathsToZones(poss);
        zonesOfPaths.map((pZone: DirSide) => { if (!resultZones.includes(pZone)) { resultZones.push(pZone); } });
        return resultZones;
    }

    protected roadPathsToZones(poss: IPoss) : Array<DirSide> {
        let cell = this.findCellOfRoad(poss);
        let zones: Array<DirSide> = [];
        if (cell) {
            if (cell.road.paths[ROAD_PATH_UP]) { zones.push(UP); }
            if (cell.road.paths[ROAD_PATH_RIGHT]) { zones.push(RIGHT); }
            if (cell.road.paths[ROAD_PATH_DOWN]) { zones.push(DOWN); }
            if (cell.road.paths[ROAD_PATH_LEFT]) { zones.push(LEFT); }
        }
        return zones;
    }

    protected cloneCombinations(combinations: Array<Array<DirSide>>, allowedSides: Array<DirSide> = []) : Array<Array<DirSide>> {
        let combos = combinations.map((combo: Array<DirSide>) => { return [...combo]; });
        combos = combos.filter((combo: Array<DirSide>) => {
            return combo.every((side: DirSide) => {
                return allowedSides.includes(side);
            });
        })
        return combos;
    }

    protected findNextCombination(combinations: Array<Array<DirSide>>, zones: Array<DirSide>) : Array<DirSide> | null {
        let ix = 0
        for (; ix < combinations.length; ix++) {
            let isComboInZones = zones.every((side: DirSide) => {
                return combinations[ix].includes(side);
            });

            if (isComboInZones) {
                break;
            }
        }
        ix++;
        if (ix < combinations.length) {
            return combinations[ix];
        }
        return null;
    }

    // ROADs

    isColoredRoadFlowsOutToDirection(toDir: DirSide, poss: IPoss) : boolean {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return false; }
        let pathType = CONF.SIDE_TO_ROAD_PATH[toDir];
        let path = cell.road.paths[pathType];
        return path && true !== path && path.from == CONF.OPPOSITE_SIDE[toDir];
    }

    protected isAnyRoadAround(poss: IPoss) : boolean { return this.isAnyRoadAtSides(poss); }
    protected isAnyRoadLeftOrRight(poss: IPoss) : boolean { return this.isAnyRoadAtSides(poss, [LEFT, RIGHT]); }

    protected isAnyRoadAtSides(poss: IPoss, sides: Array<DirSide> = SIDES) : boolean {
        for (let side of sides) {
            let sideRoadCell = this.findCellOfRoad(HH[side](poss));
            if (!sideRoadCell) { continue; }
            if (sideRoadCell.isRoadSideCellConnected(sideRoadCell, side)) { return true; }
        }
        return false;
    }

    // PATHS

    arePathsTheSame(pathsA: Array<CellPath>, pathsB: Array<CellPath>) {
        for (let ix = 0; ix < 5; ix++) {
            if (!!pathsA[ix] != !!pathsB[ix]) { return false; }
        }
        return true;
    }

    protected isCellEmptyOrRoad(poss: IPoss) : boolean {
        if (this.isCellEmpty(poss)) { return true; }
        return !!this.findCellOfRoad(poss);
    }

    private isRoadPathsEmptyByOrientation(isHorizontalOrientation: boolean, poss: IPoss) : boolean {
        if (this.isCellEmpty(poss)) { return true; }
        const cell = this.findCellOfRoad(poss);
        if (!cell) { return false; }
        if (isHorizontalOrientation) { return (!cell.road.paths[ROAD_PATH_LEFT] && !cell.road.paths[ROAD_PATH_RIGHT]); }
        return (!cell.road.paths[ROAD_PATH_UP] && !cell.road.paths[ROAD_PATH_DOWN]);
    }
    isRoadPathsEmptyHorizontal(poss: IPoss) : boolean { return this.isRoadPathsEmptyByOrientation(true, poss); }
    isRoadPathsEmptyVertical(poss: IPoss) : boolean { return this.isRoadPathsEmptyByOrientation(false, poss); }

    // SEMICONDUCTORs

    protected turnSleepSemiconductorHere(side, poss: IPoss) : boolean {
        let cell = this.findCellOfSemiconductor(HH[side](poss));
        if (!cell || !cell.semiconductor || CONF.ST_ROAD_SLEEP != cell.semiconductor.type) { return false; }
        let semi = cell.semiconductor;

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
        return  false;
    }

    protected isSemiconductorChargedAround(poss: IPoss) : boolean {
        for (let side of SIDES) {
            let cell = this.findCellOfSemiconductor(HH[side](poss));
            if (cell && cell.semiconductor.colorCharge) {
                return true;
            }
        }
        return false;
    }

    protected isSemiconductorAwakeAroundDiagonal(poss: IPoss) : boolean { return this.isSemiconductorTypeAround(poss, CONF.ST_ROAD_AWAKE, CONF.SIDES_DIAGONAL); }
    protected isSemiconductorSleepAround(poss: IPoss) : boolean { return this.isSemiconductorTypeAround(poss, CONF.ST_ROAD_SLEEP); }
    protected isSemiconductorAwakeAround(poss: IPoss) : boolean { return this.isSemiconductorTypeAround(poss, CONF.ST_ROAD_AWAKE); }
    protected isSemiconductorAwakeAtLeftOrAtRight(poss: IPoss) : boolean {
        return this.isSemiconductorTypeAround(poss, CONF.ST_ROAD_AWAKE, [LEFT, RIGHT]);
    }

    private isSemiconductorTypeAround(poss: IPoss, scType: CellSemiconductorType, sides: Array<string> = SIDES) : boolean {
        for (let side of sides) {
            let cell = this.findCellOfSemiconductor(HH[side](poss));
            if (cell && cell.semiconductor.type == scType) {
                return true;
            }
        }
        return false;
    }

    protected countAwakeClusterAtSide(poss: IPoss, checkRun: number | null, side: DirSide) : number {
        let sideCell = this.findCellOfSemiconductor(HH[side](poss));
        if (!sideCell) { return 0; }
        let semi = sideCell.semiconductor;
        if (!semi || CONF.ST_ROAD_AWAKE != semi.type) { return 0; }

        if (!checkRun) { checkRun = this.checkRun; }
        if (semi.checkRun == checkRun) { return 0; }
        semi.checkRun = checkRun;

        let count = 1;
        SIDES.map((toDir: DirSide) => {
            if (toDir == CONF.OPPOSITE_SIDE[side]) { return; }
            count += this.countAwakeClusterAtSide(HH[side](poss), checkRun, toDir)
        })
        return count;
    }

    protected countStonesAround(poss: IPoss) : number {
        return SIDES.reduce((count: number, side: DirSide) => {
            return this.findCellOfContent(HH[side](poss)) ? ++count : count;
        }, 0);
    }

    protected hasAwakeSemiNeighborsAnyStoneAround(poss: IPoss) : boolean {
        return !SIDES.every((side: DirSide) => {
            let cell = this.findCellOfSemiconductor(HH[side](poss));
            return !cell || !cell.isAwakeSemiconductor || !this.countStonesAround(cell);
        });
    }
    
    // COLORs remove from roads

    public cancelColorFromAnyRoadPathAroundCell(poss: IPoss) : void {
        SIDES.map((side: DirSide) => {
            this.cancelColorFromRoadPathAroundCellBySide(side, poss);
        });
    }

    public cancelColorFromRoadPathAroundCellBySide(side: DirSide, poss: IPoss) : void {
        this.eraseColorOnRoadPathFromSide(null, CONF.OPPOSITE_SIDE[side], HH[side](poss));
    }

    // COLORs cancel

    protected eraseColorOnRoadPath(road: CellRoad, pathType: CellRoadPathType) {
        if (road.paths[pathType]) { road.paths[pathType] = true; }
    }

    protected cancelColorPathsRoadsAroundByPaths(roadPaths: RoadPathsArray, poss: IPoss) : void {
        SIDES.map((side: DirSide) => {
            if (roadPaths[CONF.SIDE_TO_ROAD_PATH[side]]) {
                this.cancelColorFromRoadPathAroundCellBySide(side, poss);
            }
        });
    }

    protected cancelRoadColorFlowsOutPathBySide(side: DirSide, poss: IPoss) : void { this.coreCancelColorOnPathExec(false, true, true, false, side, poss); }

    private coreCancelColorOnPathExec(hasToFlowIn: boolean, hasToFlowOut: boolean, hasToBeColored: boolean, hasToBeUncolored: boolean, side: DirSide, poss: IPoss) : void {
        let cell = this.findCellOfRoad(HH[side](poss));
        let sideFrom = CONF.OPPOSITE_SIDE[side];
        if (!cell || !cell.isRoadPathFromSide(sideFrom)) { return; }

        if (hasToFlowIn || hasToFlowOut) { hasToBeColored = true; }
        if (hasToBeColored && hasToBeUncolored) { hasToBeColored = false; hasToBeUncolored = false; hasToFlowIn = false; hasToFlowOut = false; }

        if (hasToBeColored && !cell.isColoredRoadPathFromSide(sideFrom)) { return; }
        if (hasToBeUncolored && !cell.isUncoloredRoadPathFromSide(sideFrom)) { return; }
        if (hasToFlowIn && !cell.isColoredRoadPathAtSideFlowToThatSide(sideFrom)) { return; }
        if (hasToFlowOut && !cell.isColoredRoadPathAtSideFlowFromThatSide(sideFrom)) { return; }

        this.eraseColorOnRoadPathFromSide(null, CONF.OPPOSITE_SIDE[side], cell);
    }

    public verifyCheckRunForRoadPath(cell: ICellWithRoad, fromDir: DirSide, checkRun: number | null) : number | false {
        if (!checkRun) {
            checkRun = this.checkRun;
        }
        else if (checkRun == cell.road.checkRun[CONF.SIDE_TO_ROAD_PATH[fromDir]]) { return false; }

        cell.road.checkRun[CONF.SIDE_TO_ROAD_PATH[fromDir]] = checkRun;
        return checkRun;
    }

    // COLORS

    canPathSetColor(road: CellRoad, pathType: CellRoadPathType) { return true === road.paths[pathType]; }

    public isDifferentAwakeColorsAround(poss: IPoss, color: null | false | ContentColor = null, skipStones: boolean = false) : boolean {
        SIDES.forEach((side: DirSide) => {
            let sideColor = this.colorForAwakeAtSide(HH[side](poss), skipStones);
            if (!sideColor) { return; }

            if (null === color) {
                color = sideColor;
            }
            if (color != sideColor) {
                color = false;
            }
        });
        return false === color;
    }

    private colorForAwakeAtSide(poss: IPoss, skipStones: boolean) : ContentColor | null {
        let cell = this.findCell(poss);
        if (!cell) { return null; }

        if (!skipStones && cell.content) {
            return CONF.STONE_TYPE_TO_ROAD_COLOR[cell.content.type];
        }
        if (cell.semiconductor && cell.semiconductor.colorAwake) {
            return cell.semiconductor.colorAwake;
        }
        return null;
    }

    // DEV

    public _devCell: IPoss = { x: this.sizeRadius, y: this.sizeRadius };
    public devCell(poss: IPoss) { this._devCell = poss; }
    public devCellEcho(poss?: IPoss) {
        if (!poss) { poss = this._devCell; }
        let cell = this.findCell(poss);

        let showInConsole = '';
        if (!cell) {
            console.log('EMPTY ## ' + poss.x + ' ' + poss.y);
            return;
        }
        else if (cell.road) {
            showInConsole =
                'ROAD ' + ROAD_DEV[cell.road.type] +
                ' ## ' +
                cell.road.paths.map((path, ix) => {
                    if ('boolean' == typeof path) {
                        return path ? ROAD_DEV_PATH[ix] : '-'
                    }
                    else if (path) {
                        return ROAD_DEV_PATH[ix] +
                            '.' + (COLOR_DEV.hasOwnProperty(path.color) ? COLOR_DEV[path.color] : 'COLOR') +
                            '.from[' + path.from + ']';
                    }
                    else {
                        return 'ERROR'
                    }
                }).join('|');
        }
        else if (cell.content) {
            showInConsole =
                'STONE ' + COLOR_DEV[CONF.STONE_TYPE_TO_ROAD_COLOR[cell.content.type]];// +
                // (!cell.content.range.length ? '' :
                // ' ## ' +
                // cell.content.range.map(stoneType => COLOR_DEV[CONF.STONE_TYPE_TO_ROAD_COLOR[stoneType]]).join('|'));
        }
        else if (cell.trigger) {
            showInConsole =
                'TRIGGER ' + (cell.trigger.color ? COLOR_DEV[cell.trigger.color] : '');
        }
        else if (cell.speed) {
            showInConsole =
                'SPEED ' + (cell.speed.color ? COLOR_DEV[cell.speed.color] + ' ' : '') + cell.speed.to;
        }
        console.log(
            'devCellEcho',
            poss.x + ' ' + poss.y,
            showInConsole ? showInConsole : (cell.semiconductor ? cell.semiconductor : cell)
        );
    }
}