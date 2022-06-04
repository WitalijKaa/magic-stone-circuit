import * as CONF from "../config/game";
import {UP, RIGHT, DOWN, LEFT} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {ROAD_PATH_UP, ROAD_PATH_RIGHT, ROAD_PATH_DOWN, ROAD_PATH_LEFT, ROAD_PATH_HEAVY} from "../config/game"
import {CellScheme} from "./CellScheme";
import {SchemeGrid} from "../Models/Scheme/SchemeGrid";
import {GridCursor} from "./Types/GridCursor";
import {IPoss} from "./IPoss";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {CellPath, CellRoad} from "./Types/CellRoad";

const ROAD_DEV_PATH = {
    [ROAD_PATH_UP]: 'UP',
    [ROAD_PATH_RIGHT]: 'RIGHT',
    [ROAD_PATH_DOWN]: 'DOWN',
    [ROAD_PATH_LEFT]: 'LEFT',
    [ROAD_PATH_HEAVY]: 'CENTER-heavy',
}
const ROAD_DEV = {
    [ROAD_LIGHT]: 'LIGHT',
    [ROAD_HEAVY]: 'HEAVY',
    [ROAD_LEFT_RIGHT]: 'LEFT_RIGHT',
    [ROAD_UP_DOWN]: 'UP_DOWN',
}

export abstract class SchemeBase {

    name: string;

    scheme: object;
    visibleGrid!: SchemeGrid;

    activeCursor : GridCursor = { x: 0, y: 0, zone: CONF.OVER_CENTER }

    protected contentCells: { [key: string]: IPoss } = {};
    protected coloringAwaitTick = false;

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

    // CELL

    isCellEmpty(poss: IPoss) : boolean {
        return !this.scheme[poss.x] || !this.scheme[poss.x][poss.y]
    }

    getCellForContent(poss: IPoss) : false | CellScheme {
        return this.getCellFor('content', poss);
    }
    findCellOfContent(poss: IPoss) : false | CellScheme {
        return this.findCellOf('content', poss);
    }
    getCellForRoad(poss: IPoss) : false | ICellWithRoad {
        let model = this.getCellFor('road', poss) as false | ICellWithRoad;
        if (model && !model.road) {
            model.road = { type: ROAD_LIGHT, paths: [...CONF.ALL_PATHS_EMPTY] };
        }
        return model;
    }
    getCellForRoadForced(poss: IPoss) : ICellWithRoad {
        let model = this.getCell(poss);
        model.content = null;
        model.semiconductor = null;
        if (model && !model.road) {
            model.road = { type: ROAD_LIGHT, paths: [...CONF.ALL_PATHS_EMPTY] };
        }
        return model as ICellWithRoad;
    }
    findCellOfRoad(poss: IPoss) : false | ICellWithRoad {
        return this.findCellOf('road', poss) as false | ICellWithRoad;
    }

    private getCellFor(field: CellContentField, poss: IPoss) : false | CellScheme {
        if (!this.isCellEmpty(poss)) {
            let schemeCell = this.getCell(poss);
            if (schemeCell[field]) { return schemeCell; }
            return false;
        }
        return this.getCell(poss)
    }
    private findCellOf(field: CellContentField, poss: IPoss) : false | CellScheme {
        if (!this.isCellEmpty(poss)) {
            let schemeCell = this.getCell(poss);
            if (schemeCell[field]) { return schemeCell; }
        }
        return false;
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

    // LIFE CYCLE

    public updateTickInit() : void { this.updateTick(); }

    private updateTick() : void {
        if (this.isRoadBuildMode) {
            this.buildRoadTick();
        }
        else {
            // this.extractCacheActions().map((cache) => {
            //     this[cache.method](...cache.params);
            // })
            // this.updateTickContent();
        }
        setTimeout(() => { this.updateTick() }, this.coloringSpeedMs);
    }

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

    coloringCellCache(poss: IPoss) {
        // let name = this.cellName(poss);
        // if (!this.cacheColorings[name]) { this.cacheColorings[name] = []; }
        // return this.cacheColorings[name];
    }

    removeColoringCellCache(poss: IPoss) {
        // let name = this.cellName(poss);
        // if (this.cacheColorings[name]) { delete this.cacheColorings[name]; }
    }

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
                cell.road.paths.map((path, ix) => { return path ? ROAD_DEV_PATH[ix] : '-'}).join('|');
        }
        console.log(
            'devCellEcho',
            this._devCell,
            cell.road ? showInConsole : (cell.content ? 'color_' + cell.content : (cell.semiconductor ? cell.semiconductor : cell))
        );
    }
}