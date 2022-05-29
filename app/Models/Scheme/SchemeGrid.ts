import {GRID_OFFSET} from "../../config/params";
import {Container, Rectangle} from 'pixi.js'
import {CellGrid} from "../Cell/CellGrid";
import {Scheme} from "../../Core/Scheme";
import {SchemeContainer} from "./SchemeContainer";
import {Size} from "../../Core/Size";
import {Cell} from "../../Core/Cell";
import {MouseDrag} from "../../Core/Behaviors/MouseDrag";
import {ContainerModel} from "../ContainerModel";
import {MouseOver} from "../../Core/Behaviors/MouseOver";
import {CellPointer} from "../Cell/CellPointer";
import {SpriteModel} from "../SpriteModel";
import {NANO_MS, ST_ROAD} from "../../config/pixi";
import {MousePossOnGrid} from "../../Core/Types/MousePossOnGrid";
import {Poss} from "../../Core/Poss";

export class SchemeGrid {

    name: string;
    private htmlContainer: SchemeContainer;
    container: Container;
    scheme: Scheme;
    grid!: Array<Array<CellGrid>>

    dragX: number;
    dragY: number;
    offsetX: number = 0;
    offsetY: number = 0;

    mouseLock = false;
    pointedCellZone: CellPointer;

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

        new MouseDrag(new ContainerModel(this.container), this, { [MouseDrag.DRAGGING_RIGHT]: 'dragGridPx' });

        new MouseOver(new ContainerModel(this.container), this, { [MouseOver.MOUSE_MOVE]: 'handleMouseMove' });
        this.pointedCellZone = new CellPointer(this);
        this.pointedCellZone.setSize(this.cellSizePx);
        this.addCellToStage(this.pointedCellZone);
    }

    private addCellToStage(cell: SpriteModel | ContainerModel) : void {
        this.container.addChild(cell.model);
    }

    private execForCells(method: string, params: any[] = [], reverseMode: boolean = false) {
        if (!reverseMode) {
            for (let xCell = 0; xCell < this.grid.length; xCell++) {
                for (let yCell = 0; yCell < this.grid[xCell].length; yCell++) {
                    this.grid[xCell][yCell][method](...params);
                }
            }
        }
        else {
            for (let xCell = this.grid.length - 1; xCell >= 0; xCell--) {
                for (let yCell = this.grid[xCell].length - 1; yCell >= 0; yCell--) {
                    this.grid[xCell][yCell][method](...params);
                }
            }
        }
    }

    // CREATING

    private createGrid() : void {
        this.grid = [];
        for (let xCell = 0; xCell < this.gridCellsAreaSize.width; xCell++) {
            this.addCellsColumn(xCell);
        }
    }

    private addCellsColumn(xCell: number) : void {
        let column: Array<CellGrid> = [];
        for (let yCell = 0; yCell < this.gridCellsAreaSize.height; yCell++) {
            column.push(this.createCell(xCell, yCell));
        }
        this.grid.push(column);
    }

    private createCell(x: number, y: number) : CellGrid {
        let cellModel = new CellGrid(new Cell(x, y), this);
        cellModel.setSize(this.cellSizePx).setPosition(x, y);
        this.addCellToStage(cellModel);
        return cellModel;
    }

    // RESIZING

    public resetVisibleGrid() : void {
        while (this.visibleCellsAreaCurrentWidth > this.gridCellsAreaSize.width) {
            this.removeCellsColumn();
        }
        while (this.visibleCellsAreaCurrentHeight > this.gridCellsAreaSize.height) {
            this.removeCellsRow();
        }
        let columnAdded = 0;
        while (this.visibleCellsAreaCurrentWidth < this.gridCellsAreaSize.width) {
            this.addCellsColumn(this.grid.length);
            columnAdded++;
        }
        while (this.visibleCellsAreaCurrentHeight < this.gridCellsAreaSize.height) {
            this.addCellsRow(columnAdded);
        }
    }

    private addCellsRow(skipLast = 0) {
        let yCell = this.grid[0].length;
        for (let xCell = 0; xCell < this.grid.length - skipLast; xCell++) {
            this.grid[xCell].push(this.createCell(xCell, yCell));
        }
    }

    private removeCellsRow() : void {
        for (let xCell = 0; xCell < this.grid.length; xCell++) {
            let lastIX = this.grid[xCell].length - 1;
            this.grid[xCell][lastIX].destroy();
            this.grid[xCell].pop();
        }
    }
    private removeCellsColumn() : void {
        let lastIX = this.grid.length - 1;
        for (let yCell = 0; yCell < this.grid[lastIX].length; yCell++) {
            this.grid[lastIX][yCell].destroy();
        }
        this.grid.pop();
    }

    // DRAGGING

    dragGridPx(x: number, y: number) {
        this.offsetX += x;
        this.offsetY += y;

        let cellsOffset: Poss = [0, 0];
        if (Math.abs(this.offsetX) > this.cellSizePx) {
            let dir = this.offsetX < 0 ? 1 : -1;
            cellsOffset[0] = dir;
            this.offsetX += dir * this.cellSizePx;
        }
        if (Math.abs(this.offsetY) > this.cellSizePx) {
            let dir = this.offsetY < 0 ? 1 : -1;
            cellsOffset[1] = dir;
            this.offsetY += dir * this.cellSizePx;
        }
        this.dragGrid(...cellsOffset);
        this.execForCells('updatePosition');
    }

    dragGrid(x: number, y: number) {
        if (!x && !y) { return; }

        this.dragX += x; // todo out of diameter
        this.dragY += y;

        //this.execForVisibleCells('refreshVisibleAll');
    }

    // HANDLERS

    lastMouseMovePositions!: MousePossOnGrid;
    handleMouseMove(pxGlobalX, pxGlobalY) {
        if (!this.mouseLock) {
            this.mouseLock = true;
            this.lastMouseMovePositions = this.globalPxToLocalCellPx(pxGlobalX, pxGlobalY);
            let zone = this.pointedCellZone.findOverZoneType(...this.lastMouseMovePositions.localCellPx);
            this.lastMouseMovePositions.zone = zone;
            if (ST_ROAD == ST_ROAD) { // todo
                this.pointedCellZone.showZone(zone, ...this.lastMouseMovePositions.localGrid);
            }
            this.scheme.setActiveCursorPosition(zone, ...this.lastMouseMovePositions.globalGrid);

            setTimeout(() => { this.mouseLock = false;}, NANO_MS);
        }
    }

    // CURSOR

    globalPxToLocalCellPx(pxGlobalX, pxGlobalY) : MousePossOnGrid {
        let localX = Math.floor((pxGlobalX - this.offsetX) / this.cellSizePx);
        let cellX = Math.floor((pxGlobalX - this.offsetX) - (localX * this.cellSizePx));
        let localY = Math.floor((pxGlobalY - this.offsetY) / this.cellSizePx);
        let cellY = Math.floor((pxGlobalY - this.offsetY) - (localY * this.cellSizePx));
        return {
            localGrid: [localX + GRID_OFFSET, localY + GRID_OFFSET],
            globalGrid: [localX + this.dragX, localY + this.dragY],
            localCellPx: [cellX, cellY],
        };
    }

    // GETTERS

    get visibleCellsAreaCurrentWidth() : number { return this.grid.length; }
    get visibleCellsAreaCurrentHeight() : number { return this.grid[0].length; }

    get gridCellsAreaSize() : Size {
        return {
            width: GRID_OFFSET * 2 + this.htmlContainer.widthCells,
            height: GRID_OFFSET * 2 + this.htmlContainer.heightCells,
        };
    }
    get cellSizePx() : number { return this.htmlContainer.cellSizePx; }
}