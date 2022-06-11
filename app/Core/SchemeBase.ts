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
    protected get checkRun() : number { return this._checkRun++; }

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

    abstract get isRoadBuildMode() : boolean;
    abstract buildRoadTick() : void;

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

    isCellEmpty(poss: IPoss) : boolean {
        return !this.scheme[poss.x] || !this.scheme[poss.x][poss.y]
    }

    getCellForContent(poss: IPoss) : null | CellScheme {
        return this.getCellFor('content', poss);
    }
    findCellOfContent(poss: IPoss) : null | ICellWithContent {
        return this.findCellOf('content', poss) as null | ICellWithContent;
    }
    getCellForRoad(poss: IPoss) : null | ICellWithRoad {
        let model = this.getCellFor('road', poss) as null | ICellWithRoad;
        if (model && !model.road) {
            model.road = { type: ROAD_LIGHT, paths: [...CONF.ALL_PATHS_EMPTY], checkRun: null };
        }
        return model;
    }
    getCellForRoadForced(poss: IPoss) : ICellWithRoad {
        let model = this.getCell(poss);
        model.content = null;
        model.semiconductor = null;
        if (model && !model.road) {
            model.road = { type: ROAD_LIGHT, paths: [...CONF.ALL_PATHS_EMPTY], checkRun: null };
        }
        return model as ICellWithRoad;
    }
    findCellOfRoad(poss: IPoss) : false | ICellWithRoad {
        return this.findCellOf('road', poss) as false | ICellWithRoad;
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

    cellName (poss: IPoss) : string { return poss.x + '|' + poss.y; }

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
    devCellEcho() {
        let cell = this.findCell(this._devCell);

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
                        return ROAD_DEV_PATH[ix] + '-' + (COLOR_DEV.hasOwnProperty(path.color) ? COLOR_DEV[path.color] : 'COLOR')
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