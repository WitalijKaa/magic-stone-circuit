import {Cell} from "./Cell";
import {CellScheme} from "./CellScheme";
import {SchemeGrid} from "../Models/Scheme/SchemeGrid";

export class SchemeBase {

    name: string;

    scheme: object;
    visibleGrid!: SchemeGrid;

    constructor(name: string) {
        this.name = name;
        this.scheme = {};
    }

    init(grid: SchemeGrid) : void {
        this.visibleGrid = grid
    }

    isCellEmpty(cell: Cell) : boolean {
        return !!this.scheme[cell.x] || !!this.scheme[cell.x][cell.y]
    }

    public getCell(cell: Cell) : CellScheme {
        if (!this.scheme[cell.x] || !this.scheme[cell.x][cell.y]) {
            return this.createCell(cell);
        }
        return this.scheme[cell.x][cell.y];
    }

    public killCell(cell: Cell) : void {
        if (!this.scheme[cell.x] || !this.scheme[cell.x][cell.y]) {
            delete this.scheme[cell.x][cell.y];
        }
    }

    private createCell(cell: Cell) : CellScheme {
        let cellScheme = new CellScheme(cell.x, cell.y, this);

        if (!this.scheme[cell.x]) { this.scheme[cell.x] = {}; }
        this.scheme[cell.x][cell.y] = cellScheme;

        return cellScheme;
    }

    get sizeRadius() : number { return 800000000; }
}