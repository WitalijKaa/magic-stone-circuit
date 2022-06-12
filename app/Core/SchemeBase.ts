import * as CONF from "../config/game";
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {ROAD_PATH_UP, ROAD_PATH_RIGHT, ROAD_PATH_DOWN, ROAD_PATH_LEFT, ROAD_PATH_HEAVY} from "../config/game"
import {CellScheme} from "./CellScheme";
import {SchemeGrid} from "../Models/Scheme/SchemeGrid";
import {GridCursor} from "./Types/GridCursor";
import {IPoss} from "./IPoss";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {CellPath, CellRoad, CellRoadPathType, CellRoadType} from "./Types/CellRoad";
import {HH} from "./HH";
import {ColorCellCache} from "./Types/ColorCellCache";
import {DirSide} from "./Types/DirectionSide";
import {ICellWithContent} from "./Interfaces/ICellWithContent";
import {Cell} from "./Cell";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {CellSemiconductorDirection, CellSemiconductorType} from "./Types/CellSemiconductor";

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

    name: string;

    scheme: object;
    visibleGrid!: SchemeGrid;

    activeCursor: GridCursor = { x: 0, y: 0, zone: CONF.OVER_CENTER }

    protected contentCells: { [key: string]: IPoss } = {};
    protected coloringAwaitTick = false;

    private _checkRun: number = 1;
    public get checkRun() : number { return this._checkRun += 3; }

    constructor(name: string) {
        this.name = name;
        this.scheme = {};
    }

    init(grid: SchemeGrid) : void {
        this.visibleGrid = grid
    }

    public get sizeRadius() : number { return 800000000; }
    private get coloringSpeedMs() : number { return 200; }

    // ABSTRACT

    public abstract get isRoadBuildMode() : boolean;
    public abstract buildRoadTick() : void;
    protected abstract cancelColorOnRoadCell(checkRun: number | null, fromDir: DirSide, poss: IPoss): void;

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
                        method: 'setColorAroundByStone',
                        params: [this.contentCells[cellName]],
                        cacheDirections: [...CONF.SIDES],
                    });
                }
                else if (cell.semiconductor && CONF.ST_ROAD_SLEEP == cell.semiconductor.type) {
                    this.coloringCellCache(this.contentCells[cellName]).push({
                        type: CONF.ST_ROAD_SLEEP,
                        method: 'setColorAroundBySleep',
                        params: [false, this.contentCells[cellName].x, this.contentCells[cellName].y],
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
    protected getCellForRoadForced(poss: IPoss) : ICellWithRoad {
        let model = this.getCell(poss);
        model.content = null;
        model.semiconductor = null;
        if (model && !model.road) {
            model.road = { type: ROAD_LIGHT, paths: [...CONF.ALL_PATHS_EMPTY], checkRun: 0 };
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
        return this.scheme[poss.x][poss.y];
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

    protected antiCell(poss: IPoss) : CellScheme {
        return new CellScheme(poss.x, poss.y, this);
    }

    protected cellName (poss: IPoss) : string { return poss.x + '|' + poss.y; }

    protected iPossClone(poss: IPoss) : IPoss { return { x: poss.x, y: poss.y } }

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

    mergeZones(zones: Array<string>, poss: IPoss) {
        let resultZones = [...zones];
        let zonesOfPaths = this.roadPathsToZones(poss);
        zonesOfPaths.map((pZone) => { if (!resultZones.includes(pZone)) { resultZones.push(pZone); } });
        return resultZones;
    }

    roadPathsToZones(poss: IPoss) : Array<string> {
        let cell = this.findCellOfRoad(poss);
        let zones: Array<string> = [];
        if (cell) {
            if (cell.road.paths[ROAD_PATH_UP]) { zones.push(CONF.UP); }
            if (cell.road.paths[ROAD_PATH_RIGHT]) { zones.push(CONF.RIGHT); }
            if (cell.road.paths[ROAD_PATH_DOWN]) { zones.push(CONF.DOWN); }
            if (cell.road.paths[ROAD_PATH_LEFT]) { zones.push(CONF.LEFT); }
        }
        return zones;
    }

    // ROADs

    isColoredRoadFlowsOutToDirection(toDir: DirSide, poss: IPoss) : boolean {
        let cell = this.findCellOfRoad(poss);
        if (!cell) { return false; }
        let path = CONF.SIDE_TO_ROAD_PATH[toDir];
        // @ts-ignore
        return !!(cell.road && cell.road.paths[path] && true !== cell.road.paths[path] && cell.road.paths[path].from == CONF.OPPOSITE_SIDE[toDir]);
    }

    // PATHS

    arePathsTheSame(pathsA: Array<CellPath>, pathsB: Array<CellPath>) {
        for (let ix = 0; ix < 5; ix++) {
            if (!!pathsA[ix] != !!pathsB[ix]) { return false; }
        }
        return true;
    }

    canSetRoad(poss: IPoss) : boolean {
        if (this.isCellEmpty(poss)) { return true; }
        return !!this.findCellOfRoad(poss);
    }

    canSetRoadAndIsPathsEmptyAtOrientation(isHorizontalOrientation: boolean, poss: IPoss) : boolean {
        if (this.isCellEmpty(poss)) { return true; }
        const cell = this.findCellOfRoad(poss);
        if (!cell) { return false; }
        if (isHorizontalOrientation) { return (!cell.road.paths[ROAD_PATH_LEFT] && !cell.road.paths[ROAD_PATH_RIGHT]); }
        return (!cell.road.paths[ROAD_PATH_UP] && !cell.road.paths[ROAD_PATH_DOWN]);
    }
    isRoadPathsEmptyHorizontal(poss: IPoss) : boolean { return this.canSetRoadAndIsPathsEmptyAtOrientation(true, poss); }
    isRoadPathsEmptyVertical(poss: IPoss) : boolean { return this.canSetRoadAndIsPathsEmptyAtOrientation(false, poss); }

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

    // COLORS cancel

    cancelNeighborsColorPathForAnyRoad(poss: IPoss) : void {
        this.cancelNeighborsColorPathForAnyRoadByPaths([...CONF.ALL_PATHS_ARE], poss);
    }

    cancelNeighborsColorPathForAnyRoadByPaths(roadPaths: Array<CellPath>, poss: IPoss) : void {
        SIDES.map((toDir: DirSide) => {
            if (roadPaths[CONF.SIDE_TO_ROAD_PATH[toDir]]) {
                this.cancelColorAnyRoadPathByDir(toDir, poss);
            }
        });
    }

    cancelColorAnyRoadPathByDir(toDir: DirSide, poss: IPoss) : void { this.cancelColorPathBySideByParams(false, false, false, false, toDir, poss); }
    cancelColorFlowsOutRoadPathByDir(toDir: DirSide, poss: IPoss) : void { this.cancelColorPathBySideByParams(false, true, true, false, toDir, poss); }

    cancelColorPathBySideByParams(hasToFlowIn: boolean, hasToFlowOut: boolean, hasToBeColored: boolean, hasToBeUncolored: boolean, toSide: DirSide, poss: IPoss) : void {
        let sideCell = this.findCellOfRoad(Cell[toSide](poss));
        let sideCellFromDir = CONF.OPPOSITE_SIDE[toSide];
        if (!sideCell || !sideCell.isRoadPathFromSide(sideCellFromDir)) { return; }

        if (hasToFlowIn || hasToFlowOut) { hasToBeColored = true; }
        if (hasToBeColored && hasToBeUncolored) { hasToBeColored = false; hasToBeUncolored = false; hasToFlowIn = false; hasToFlowOut = false; }

        if (hasToBeColored && !sideCell.isColoredRoadPathFromSide(sideCellFromDir)) { return; }
        if (hasToBeUncolored && !sideCell.isUncoloredRoadPathFromSide(sideCellFromDir)) { return; }
        if (hasToFlowIn && !sideCell.isColoredRoadPathAtSideFlowToThatSide(sideCellFromDir)) { return; }
        if (hasToFlowOut && !sideCell.isColoredRoadPathAtSideFlowFromThatSide(sideCellFromDir)) { return; }

        this.cancelColorOnRoadCell(null, CONF.OPPOSITE_SIDE[toSide], sideCell);
    }

    // COLORS

    cacheColorings: {[key: string]: Array<ColorCellCache>} = {};

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
    canPathCancelColor(road: CellRoad, pathType: CellRoadPathType) { return !!(true !== road.paths[pathType] && road.paths[pathType]); }

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

    _devCell: IPoss = { x: this.sizeRadius, y: this.sizeRadius };
    devCell(poss: IPoss) { this._devCell = poss; }
    devCellEcho(poss?: IPoss) {
        if (!poss) { poss = this._devCell; }
        let cell = this.findCell(poss);

        let showInConsole = '';
        if (!cell) {
            console.log('EMPTY ## ' + this._devCell.x + ' ' + this._devCell.y);
            return;
        }
        else if (cell.road) {
            showInConsole =
                'Type ' + ROAD_DEV[cell.road.type] +
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
        console.log(
            'devCellEcho',
            this._devCell,
            cell.road ? showInConsole : (cell.content ? 'color_' + cell.content : (cell.semiconductor ? cell.semiconductor : cell))
        );
    }
}