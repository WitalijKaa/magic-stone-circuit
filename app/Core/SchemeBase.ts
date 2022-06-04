import * as CONF from "../config/game";
import {UP, RIGHT, DOWN, LEFT} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {CellScheme} from "./CellScheme";
import {SchemeGrid} from "../Models/Scheme/SchemeGrid";
import {GridCursor} from "./Types/GridCursor";
import {IPoss} from "./IPoss";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {CellPath, CellRoad} from "./Types/CellRoad";

const ROAD_DEV_PATH = {
    [CONF.ROAD_PATH_UP]: 'UP',
    [CONF.ROAD_PATH_RIGHT]: 'RIGHT',
    [CONF.ROAD_PATH_DOWN]: 'DOWN',
    [CONF.ROAD_PATH_LEFT]: 'LEFT',
    [CONF.ROAD_PATH_HEAVY]: 'CENTER-heavy',
}
const ROAD_DEV = {
    [CONF.ROAD_LIGHT]: 'LIGHT',
    [CONF.ROAD_HEAVY]: 'HEAVY',
    [CONF.ROAD_LEFT_RIGHT]: 'LEFT_RIGHT',
    [CONF.ROAD_UP_DOWN]: 'UP_DOWN',
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

    isCellEmpty(cell: IPoss) : boolean {
        return !this.scheme[cell.x] || !this.scheme[cell.x][cell.y]
    }

    getCellForContent(cell: IPoss) : false | CellScheme {
        // @ts-ignore
        return this.getCellFor('content', cell);
    }
    findCellOfContent(cell: IPoss) : false | CellScheme {
        // @ts-ignore
        return this.findCellOf('content', cell);
    }
    getCellForRoad(cell: IPoss) : false | ICellWithRoad {
        let model = this.getCellFor('road', cell);
        if (model) {
        }
        if (model && !model.road) {
            model.road = { type: CONF.ROAD_LIGHT, paths: [...CONF.ALL_PATHS_EMPTY] };
        }
        if (model) {
        }
        // @ts-ignore
        return model;
    }
    findCellOfRoad(cell: IPoss) : false | ICellWithRoad {
        // @ts-ignore
        return this.findCellOf('road', cell);
    }

    private getCellFor(field: CellContentField, cell: IPoss) : false | CellScheme {
        if (!this.isCellEmpty(cell)) {
            let schemeCell = this.getCell(cell);
            if (schemeCell[field]) { return schemeCell; }
            return false;
        }
        return this.getCell(cell)
    }
    private findCellOf(field: CellContentField, cell: IPoss) : false | CellScheme {
        if (!this.isCellEmpty(cell)) {
            let schemeCell = this.getCell(cell);
            if (schemeCell[field]) { return schemeCell; }
        }
        return false;
    }

    public findCell(cell: IPoss) : null | CellScheme {
        if (this.isCellEmpty(cell)) { return null; }
        return this.scheme[cell.x][cell.y];
    }

    public getCell(cell: IPoss) : CellScheme {
        if (!this.scheme[cell.x] || !this.scheme[cell.x][cell.y]) {
            return this.createCell(cell);
        }
        return this.scheme[cell.x][cell.y];
    }

    public killCell(cell: IPoss) : void {
        if (this.scheme[cell.x] && this.scheme[cell.x][cell.y]) {
            delete this.scheme[cell.x][cell.y];
        }
    }

    private createCell(cell: IPoss) : CellScheme {
        let cellScheme = new CellScheme(cell.x, cell.y, this);

        if (!this.scheme[cell.x]) { this.scheme[cell.x] = {}; }
        this.scheme[cell.x][cell.y] = cellScheme;

        return cellScheme;
    }

    public get sizeRadius() : number { return 800000000; }

    cellName (poss: IPoss) : string { return poss.x + '|' + poss.y; }

    // CURSOR

    setActiveCursorPosition(zone, x, y) : void {
        this.activeCursor.x = x;
        this.activeCursor.y = y;
        this.activeCursor.zone = zone;
    }

    // ROADS

    protected isRoadBuildMode = false;

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
            if (cell.road.paths[CONF.ROAD_PATH_UP]) { zones.push(CONF.UP); }
            if (cell.road.paths[CONF.ROAD_PATH_RIGHT]) { zones.push(CONF.RIGHT); }
            if (cell.road.paths[CONF.ROAD_PATH_DOWN]) { zones.push(CONF.DOWN); }
            if (cell.road.paths[CONF.ROAD_PATH_LEFT]) { zones.push(CONF.LEFT); }
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