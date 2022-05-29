import {GRID_OFFSET} from "../../config/params";
import {Container, Rectangle} from 'pixi.js'
import {CellGrid} from "../Cell/CellGrid";
import {Scheme} from "../../Core/Scheme";
import {SchemeContainer} from "./SchemeContainer";
import {Size} from "../../Core/Size";
import {Cell} from "../../Core/Cell";

export class SchemeGrid {

    name: string;
    htmlContainer: SchemeContainer;
    container: Container;
    scheme: Scheme;
    grid!: Array<Array<CellGrid>>

    dragX: number;
    dragY: number;
    offsetX: number = 0;
    offsetY: number = 0;

    constructor(name: string, scheme: Scheme, htmlContainer: SchemeContainer) {
        this.name = name;
        this.htmlContainer = htmlContainer;
        this.scheme = scheme;
        scheme.init(this);

        this.container = new Container();
        // @ts-ignore
        this.container.interactive = true;
        // @ts-ignore
        this.container.hitArea = new Rectangle(0, 0, 100000, 100000);

        this.dragX = this.dragY = scheme.sizeRadius;
        this.createGrid();
    }

    public addCellToStage(cell: CellGrid) : void {
        this.container.addChild(cell.model);
    }

    private createGrid() : void {
        this.grid = [];
        for (let xCell = 0; xCell < this.gridCellsAreaSize.width; xCell++) {
            let column: Array<CellGrid> = [];
            for (let yCell = 0; yCell < this.gridCellsAreaSize.height; yCell++) {
                column.push(this.createCell(xCell, yCell));
            }
            this.grid.push(column);
        }
        //this.execForVisibleCells('initNeighbors');
    }

    private createCell(x: number, y: number) : CellGrid {
        let cellModel = new CellGrid(new Cell(x, y), this);
        cellModel.setSize(this.htmlContainer.cellSizePx).setPosition(x, y);
        this.addCellToStage(cellModel);
        return cellModel;
    }

    get gridCellsAreaSize() : Size {
        return {
            width: GRID_OFFSET * 2 + this.htmlContainer.widthCells,
            height: GRID_OFFSET * 2 + this.htmlContainer.heightCells,
        };
    }
}