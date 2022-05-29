import {Cell} from "./Cell";
import {CellScheme} from "./CellScheme";
import {SchemeGrid} from "../Models/Scheme/SchemeGrid";
import * as CONF from "../config/pixi";
import {GridCursor} from "./Types/GridCursor";
import {IPoss} from "./IPoss";

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
        if (!this.isCellEmpty(cell)) {
            let schemeCell = this.getCell(cell);
            if (schemeCell.content) { return schemeCell; }
            return false;
        }
        else {
            return this.getCell(cell)
        }
    }
    findCellOfContent(cell: IPoss) : false | CellScheme {
        if (!this.isCellEmpty(cell)) {
            let schemeCell = this.getCell(cell);
            if (schemeCell.content) { return schemeCell; }
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

    get sizeRadius() : number { return 800000000; }

    cellName (poss: IPoss) : string { return poss.x + '|' + poss.y; }

    // CURSOR

    setActiveCursorPosition(zone, x, y) : void {
        this.activeCursor.x = x;
        this.activeCursor.y = y;
        this.activeCursor.zone = zone;
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

    _devCell!: [number, number];
    devCell(x, y) {
        this._devCell = [x, y];
    }
    devCellEcho() {
        // let cell = this.findCellOrEmpty(...this._devCell);
        //
        // let showInConsole = '';
        // if (cell.road) { showInConsole =
        //     'Type ' + ROAD_DEV[cell.road.type] +
        //     ' ## ' +
        //     cell.road.paths.map((path, ix) => { return path ? ROAD_DEV_PATH[ix] : '-'}).join('|');
        // }
        // console.log(
        //     'devCellEcho',
        //     this._devCell,
        //     cell.road ? showInConsole : (cell.content ? 'color_' + cell.content : (cell.semiconductor ? cell.semiconductor : cell))
        // );
    }
}