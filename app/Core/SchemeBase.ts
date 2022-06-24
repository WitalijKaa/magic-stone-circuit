import * as CONF from "../config/game";
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../config/game"
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
import {CellSemiconductorDirection, CellSemiconductorType, SemiColor} from "./Types/CellSemiconductor";
import {CellStone, CellStoneType} from "./Types/CellStone";
import {SchemeCopy, SchemeStructure} from "./Types/Scheme";
import {IVisibleGrid} from "./Interfaces/IVisibleGrid";
import {Cell} from "./Cell";
import {SmileComponent} from "./Components/SmileComponent";

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

    protected cSmile!: SmileComponent;

    scheme: SchemeStructure = {};
    visibleGrid!: IVisibleGrid;

    activeCursor: GridCursor = { x: 0, y: 0, zone: CONF.OVER_CENTER }

    protected contentCells: { [key: string]: IPoss } = {};
    protected cacheColorings: { [key: string]: Array<ColorCellCache> } = {};
    protected coloringAwaitTick = false;

    private _checkRun: number = 1;
    public get checkRun() : number { return this._checkRun += 3; }

    init(grid: SchemeGrid) : void {
        this.visibleGrid = grid;
        this.initComponents();
    }

    public refreshVisibleCell(poss: IPoss) {
        this.visibleGrid.refreshCell(poss);
    }

    private _saveToStorageCallback: () => void = () => {};
    public setSaveToStorageMethod(saveToStorage: () => void) : void { this._saveToStorageCallback = saveToStorage; }

    protected afterChange() : void {
        this._saveToStorageCallback();
    }

    public resetScheme() : SchemeStructure {
        this.scheme = {};
        this.contentCells = {};
        this.cacheColorings = {};
        this.coloringAwaitTick = false;
        this.visibleGrid.refreshAllCells();
        return this.scheme;
    }

    public loadScheme(source: SchemeCopy) {
        this._levelMode = false;
        let toAwake: Array<[IPoss, CellStoneType]> = [];
        for (let row in source) {
            for (let column in source[row]) {
                let schemeCell = source[row][column];
                if (!schemeCell) { continue; }
                let poss = { x: +row + 800000000 - 100, y: +column + 800000000 - 100 };

                if ('r' in schemeCell) {
                    let paths = [...CONF.ALL_PATHS_EMPTY] as RoadSavePathsArray;
                    schemeCell.r.p.split('').map((ix) => {
                        paths[+ix] = true;
                    })
                    this.getCellForRoadForced(poss, schemeCell.r.t, paths);
                }
                else if ('s' in schemeCell) {
                    this.getCellForSemiconductorForced(poss, schemeCell.s.d, schemeCell.s.t);
                    if (CONF.ST_ROAD_SLEEP == schemeCell.s.t) {
                        this.contentCells[this.cellName(poss)] = poss;
                    }
                }
                else if ('c' in schemeCell) {
                    let range = [] as Array<CellStoneType>;
                    if (schemeCell.c.r) {
                        range = schemeCell.c.r;
                    }
                    this.getCellForStoneForced(poss, { type: schemeCell.c.t, range: range });
                    this.contentCells[this.cellName(poss)] = poss;
                    toAwake.push([poss, schemeCell.c.t])
                }
                else if ('i' in schemeCell) {
                    this._devCell = Cell.clonePoss(poss).Left;
                    this.putSmile(schemeCell.i.l);
                }
            }
        }
        toAwake.map((params) => { this.setAwakeColorAroundForAwakeSemi(...params); });
        this.visibleGrid.refreshAllCells();
    }

    protected _levelMode: boolean = false;
    protected _levelModeCheck: boolean = false;
    public levelMode() {
        this._levelMode = true;
        this.setSaveToStorageMethod(() => {})
    }

    public checkLevel() {
        if (this._levelMode && !this.isRoadBuildMode) {
            this._levelModeCheck = true;
        }
    }

    public get inputAllowed() : boolean {
        return false == this._levelModeCheck;
    }

    public get sizeRadius() : number { return 800000000; }

    // SPEED

    private _coloringSpeedMs: number = 100;
    private get coloringSpeedMs() : number { return this._coloringSpeedMs; }

    public speedUp() {
        this._coloringSpeedMs -= 20;
        if (this._coloringSpeedMs < 40) { this._coloringSpeedMs = 30; }
    }
    public speedDown() {
        this._coloringSpeedMs += 30;
        if (this._coloringSpeedMs > 200) { this._coloringSpeedMs = 200; }
    }

    // ABSTRACT

    protected abstract initComponents() : void;
    public abstract get isRoadBuildMode() : boolean;
    protected abstract buildRoadTick() : void;
    protected abstract cancelColorOnRoadFromSide(checkRun: number | null, fromDir: DirSide, poss: IPoss): void;
    protected abstract setAwakeColorAroundForAwakeSemi(poss: IPoss, stoneColor: CellStoneType | null) : void;
    protected abstract setColorToSemiconductorByRoad(color: SemiColor, fromDir: DirSide, poss: IPoss) : void;
    public abstract putSmile(logic: string) : void;

    // LIFE CYCLE

    public updateTickInit() : void { this.updateTick(); }

    private updateTick() : void {
        if (this.isRoadBuildMode) {
            this.buildRoadTick();
        }
        else {
            this.extractCacheActions().map((cache: ColorCellCache) => {
                this[cache.method](...cache.params);
            })
            this.updateTickContent();
        }
        setTimeout(() => { this.updateTick() }, this.coloringSpeedMs);
    }

    // UPDATE

    private contentUpdateTickCountdown: number = 10;
    protected coloringSpeedCountdownNext: [number, number] = [3, 5];

    updateTickContent() {
        this.coloringAwaitTick = false;
        this.contentUpdateTickCountdown--;
        if (this.contentUpdateTickCountdown < 1) {
            this.contentUpdateTickCountdown = HH.rnd(...this.coloringSpeedCountdownNext);
            this.coloringAwaitTick = true;

            for (let cellName in this.contentCells) {
                let cell = this.findCell(this.contentCells[cellName]);
                if (!cell) { return; }

                if (cell.content) {
                    this.coloringCellCache(this.contentCells[cellName]).push({
                        type: CONF.ST_STONE_VIOLET,
                        method: 'setColorForRoadsAroundByStone',
                        params: [this.contentCells[cellName]],
                        cacheDirections: [...CONF.SIDES],
                    });
                }
                else if (cell.semiconductor && CONF.ST_ROAD_SLEEP == cell.semiconductor.type) {
                    this.coloringCellCache(this.contentCells[cellName]).push({
                        type: CONF.ST_ROAD_SLEEP,
                        method: 'setColorToRoadBySleepSemiconductor',
                        params: [false, this.contentCells[cellName]],
                        cacheDirections: ROAD_LEFT_RIGHT == cell.semiconductor.direction ? [LEFT, RIGHT] : [UP, DOWN],
                    });
                }
            }
        }
    }

    extractCacheActions() {
        let cacheColorings: Array<ColorCellCache> = [];
        for (let cName in this.cacheColorings) {
            if (this.cacheColorings[cName] && this.cacheColorings[cName].length) {
                cacheColorings.push(...this.cacheColorings[cName].splice(0))
                delete(this.cacheColorings[cName]);
            }
        }
        return cacheColorings;
    }

    // CELL

    public isCellEmpty(poss: IPoss) : boolean {
        return !this.scheme[poss.x] || !this.scheme[poss.x][poss.y]
    }

    protected getCellForContent(poss: IPoss) : null | CellScheme {
        return this.getCellFor('content', poss);
    }
    protected getCellForStoneForced(poss: IPoss, stone: CellStone) {
        let model = this.getCell(poss);
        model.road = null;
        model.semiconductor = null;
        model.content = stone;
        return model as ICellWithContent;
    }
    public findCellOfContent(poss: IPoss) : null | ICellWithContent {
        return this.findCellOf('content', poss) as null | ICellWithContent;
    }

    protected getCellForRoad(poss: IPoss) : null | ICellWithRoad {
        let model = this.getCellFor('road', poss) as null | ICellWithRoad;
        if (model && !model.road) {
            model.road = { type: ROAD_LIGHT, paths: [...CONF.ALL_PATHS_EMPTY], checkRun: 0 };
        }
        return model;
    }
    protected getCellForRoadForced(poss: IPoss, type: CellRoadType = ROAD_LIGHT, paths: RoadPathsArray = [...CONF.ALL_PATHS_EMPTY]) : ICellWithRoad {
        let model = this.getCell(poss);
        model.content = null;
        model.semiconductor = null;
        if (model && !model.road) {
            model.road = { type: type, paths: paths, checkRun: 0 };
        }
        return model as ICellWithRoad;
    }
    public findCellOfRoad(poss: IPoss) : null | ICellWithRoad {
        return this.findCellOf('road', poss) as null | ICellWithRoad;
    }

    protected getCellForSemiconductorForced(poss: IPoss, dir: CellSemiconductorDirection, type: CellSemiconductorType) : ICellWithSemiconductor {
        let model = this.getCell(poss);
        model.content = null;
        model.road = null;
        if (model) {
            model.semiconductor = { direction: dir, type: type, colorAwake: null, colorFlow: null, colorCharge: null, from: null, checkRun: 0 };
        }
        return model as ICellWithSemiconductor;
    }
    public findCellOfSemiconductor(poss: IPoss) : null | ICellWithSemiconductor {
        return this.findCellOf('semiconductor', poss) as null | ICellWithSemiconductor;
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
        return this.scheme[poss.x][poss.y];
    }

    public getCell(poss: IPoss) : CellScheme {
        if (!this.scheme[poss.x] || !this.scheme[poss.x][poss.y]) {
            return this.createCell(poss);
        }
        return this.scheme[poss.x][poss.y]!;
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

    // CURSOR

    setActiveCursorPosition(zone, x, y) : void {
        this.activeCursor.x = x;
        this.activeCursor.y = y;
        this.activeCursor.zone = zone;
    }

    // ZONES

    zonesToRoadPaths(zones: Array<string>, isHeavy: CellPath) : Array<boolean> {
        let paths = [false, false, false, false, !!isHeavy];
        zones.map((zone) => { paths[CONF.SIDE_TO_ROAD_PATH[zone]] = true; });
        return paths;
    }

    protected zonesMergedWithRoadPathsAsDirSide(zones: Array<DirSide>, poss: IPoss) : Array<DirSide> {
        let resultZones = [...zones];
        let zonesOfPaths = this.roadPathsToZones(poss);
        zonesOfPaths.map((pZone: DirSide) => { if (!resultZones.includes(pZone)) { resultZones.push(pZone); } });
        return resultZones;
    }

    private roadPathsToZones(poss: IPoss) : Array<string> {
        let cell = this.findCellOfRoad(poss);
        let zones: Array<string> = [];
        if (cell) {
            if (cell.road.paths[ROAD_PATH_UP]) { zones.push(UP); }
            if (cell.road.paths[ROAD_PATH_RIGHT]) { zones.push(RIGHT); }
            if (cell.road.paths[ROAD_PATH_DOWN]) { zones.push(DOWN); }
            if (cell.road.paths[ROAD_PATH_LEFT]) { zones.push(LEFT); }
        }
        return zones;
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

    // COLORs cancel

    protected eraseColorOnRoadPath(road: CellRoad, pathType: CellRoadPathType) {
        if (road.paths[pathType]) { road.paths[pathType] = true; }
    }

    protected cancelColorPathsForAnyRoadAround(poss: IPoss) : void {
        SIDES.map((side: DirSide) => {
            this.cancelRoadColorPathBySide(side, poss);
            //this.setColorToSemiconductorByRoad(null, CONF.OPPOSITE_SIDE[side], HH[side](poss));
        });
    }

    protected cancelColorPathsRoadsAroundByPaths(roadPaths: RoadPathsArray, poss: IPoss) : void {
        SIDES.map((side: DirSide) => {
            if (roadPaths[CONF.SIDE_TO_ROAD_PATH[side]]) {
                this.cancelRoadColorPathBySide(side, poss);
            }
        });
    }

    protected cancelColorsAroundByRoadPaths(roadPaths: RoadPathsArray, poss: IPoss) : void {
        SIDES.map((toDir: DirSide) => {
            if (this.isColoredRoadFlowsOutToDirection(toDir, poss)) {
                this.setColorToSemiconductorByRoad(null, CONF.OPPOSITE_SIDE[toDir], HH[toDir](poss));
                this.cSmile.setColorToSmileByRoad(null, CONF.OPPOSITE_SIDE[toDir], HH[toDir](poss));
            }
        });
    }

    private cancelRoadColorPathBySide(side: DirSide, poss: IPoss) : void { this.cancelColorPathBySideByParams(false, false, false, false, side, poss); }
    protected cancelRoadColorFlowsOutPathBySide(side: DirSide, poss: IPoss) : void { this.cancelColorPathBySideByParams(false, true, true, false, side, poss); }

    private cancelColorPathBySideByParams(hasToFlowIn: boolean, hasToFlowOut: boolean, hasToBeColored: boolean, hasToBeUncolored: boolean, side: DirSide, poss: IPoss) : void {
        let sideCell = this.findCellOfRoad(HH[side](poss));
        let sideFrom = CONF.OPPOSITE_SIDE[side];
        if (!sideCell || !sideCell.isRoadPathFromSide(sideFrom)) { return; }

        if (hasToFlowIn || hasToFlowOut) { hasToBeColored = true; }
        if (hasToBeColored && hasToBeUncolored) { hasToBeColored = false; hasToBeUncolored = false; hasToFlowIn = false; hasToFlowOut = false; }

        if (hasToBeColored && !sideCell.isColoredRoadPathFromSide(sideFrom)) { return; }
        if (hasToBeUncolored && !sideCell.isUncoloredRoadPathFromSide(sideFrom)) { return; }
        if (hasToFlowIn && !sideCell.isColoredRoadPathAtSideFlowToThatSide(sideFrom)) { return; }
        if (hasToFlowOut && !sideCell.isColoredRoadPathAtSideFlowFromThatSide(sideFrom)) { return; }

        this.cancelColorOnRoadFromSide(null, CONF.OPPOSITE_SIDE[side], sideCell);
    }

    protected verifyThatCheckRunForRoadCancelColorIsOk(road: CellRoad, checkRun: number | null) : number | false {
        if (!checkRun) {
            checkRun = this.checkRun;
        }
        else if (checkRun + 1 == road.checkRun) { return false; }

        if (road.checkRun == checkRun) { road.checkRun = checkRun + 1; } // allow twice to cancel color on a cell
        else { road.checkRun = checkRun; }

        return checkRun;
    }

    // COLORS

    coloringCellCache(poss: IPoss) : Array<ColorCellCache> {
        let name = this.cellName(poss);
        if (!this.cacheColorings[name]) { this.cacheColorings[name] = []; }
        return this.cacheColorings[name];
    }

    removeColoringCellCache(poss: IPoss) {
        let name = this.cellName(poss);
        if (this.cacheColorings[name]) { delete this.cacheColorings[name]; }
    }

    canPathSetColor(road: CellRoad, pathType: CellRoadPathType) { return true === road.paths[pathType]; }

    removeColoringCellCacheToDir(toDir, poss: IPoss) {
        let name = this.cellName(poss);
        if (this.cacheColorings[name]) {
            for (let ix = this.cacheColorings[name].length - 1; ix >= 0; ix--) {
                let cache = this.cacheColorings[name][ix];
                if (cache.cacheDirections.includes((toDir))) {
                    this.cacheColorings[name].splice(ix, 1);
                }
            }
        }
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
                'STONE ' + COLOR_DEV[CONF.STONE_TYPE_TO_ROAD_COLOR[cell.content.type]] +
                (!cell.content.range.length ? '' :
                ' ## ' +
                cell.content.range.map(stoneType => COLOR_DEV[CONF.STONE_TYPE_TO_ROAD_COLOR[stoneType]]).join('|'));
        }
        console.log(
            'devCellEcho',
            poss.x + ' ' + poss.y,
            showInConsole ? showInConsole : (cell.semiconductor ? cell.semiconductor : cell)
        );
    }
}