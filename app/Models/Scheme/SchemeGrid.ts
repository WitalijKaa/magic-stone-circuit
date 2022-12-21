import * as CONF from "../../config/game";
import {Container} from '@pixi/display';
import {Rectangle} from '@pixi/math';
import {CellGrid} from "../Cell/CellGrid";
import {Scheme} from "../../Core/Scheme";
import {SchemeContainer, SchemeScaleSize} from "./SchemeContainer";
import {Size} from "../../Core/Size";
import {Cell} from "../../Core/Cell";
import {MouseDrag} from "../../Core/Behaviors/MouseDrag";
import {ContainerModel} from "../ContainerModel";
import {MouseOver} from "../../Core/Behaviors/MouseOver";
import {CellPointer} from "../Cell/CellPointer";
import {SpriteModel} from "../SpriteModel";
import {MousePossOnGrid} from "../../Core/Types/MousePossOnGrid";
import {Poss} from "../../Core/Poss";
import {IPoss} from "../../Core/IPoss";
import {IVisibleGrid} from "../../Core/Interfaces/IVisibleGrid";
import {CONTROL_EVENTS_KEYS} from "../../config/controls";

export class SchemeGrid implements IVisibleGrid {

    container: Container;
    containerFront: Container;
    grid!: Array<Array<CellGrid>>

    scale: SchemeScaleSize = 1;
    dragX: number;
    dragY: number;
    offsetX: number = 0;
    offsetY: number = 0;

    mouseLock = false;
    private pointedCellZone!: CellPointer;

    private controlPenCode: any = CONF.ST_STONE_VIOLET;
    private controlPenCodePrev: any = CONF.ST_STONE_VIOLET;
    private allowedPrevCodes = [
        CONF.ST_STONE_VIOLET,
        CONF.ST_STONE_RED,
        CONF.ST_STONE_INDIGO,
        CONF.ST_STONE_ORANGE,
        CONF.ST_ROAD_SLEEP,
        CONF.ST_ROAD_AWAKE,
        CONF.ST_TRIGGER,
        CONF.ST_SPEED,
        CONF.ST_GEN,
        CONF.ST_BORDER,
        CONF.ST_ROAD,
        CONF.ST_EMPTY
    ];

    constructor(public scheme: Scheme, public htmlContainer: SchemeContainer) {
        this.htmlContainer = htmlContainer;
        this.scheme = scheme;
        scheme.init(this);

        this.container = new Container();
        // @ts-ignore
        this.container.interactive = true;
        // @ts-ignore
        this.container.hitArea = new Rectangle(0, 0, 100000, 100000);
        this.containerFront = new Container();

        this.dragX = this.dragY = scheme.sizeRadius;

        new MouseDrag(new ContainerModel(this.container), this, { [MouseDrag.DRAGGING_RIGHT]: 'dragGridPx' });
        new MouseOver(new ContainerModel(this.container), this, { [MouseOver.MOUSE_MOVE]: 'handleMouseMove' });

        this.createScaledGrid();

        setTimeout(() => { this.scheme.updateTickInit(); }, CONF.START_TIMEOUT);
    }

    public createScaledGrid() {
        this.createGrid();
        this.pointedCellZone = new CellPointer(this);
        this.pointedCellZone.setSize(this.cellSizePx);
        this.containerFront.addChild(this.pointedCellZone.model);
    }

    public changeScale(change: number) {
        let nextScale = this.scale + change;
        if (nextScale > 3) { nextScale = 3; }
        if (nextScale < 1) { nextScale = 1; }

        if (nextScale == this.scale) { return; }
        this.scale = nextScale as SchemeScaleSize;

        this.container.children.forEach((child) => { child.destroy(); })
        this.containerFront.children.forEach((child) => { child.destroy(); })

        this.container.removeChildren();
        this.containerFront.removeChildren();
        this.htmlContainer.changeScale(this.scale);

        if (this.lastMouseMovePositions) {
            let nextLocalX = Math.floor((this.lastMouseMovePositions.pxGlobal[0] - this.offsetX) / this.cellSizePx);
            let nextLocalY = Math.floor((this.lastMouseMovePositions.pxGlobal[1] - this.offsetY) / this.cellSizePx);
            this.dragX = this.lastMouseMovePositions.globalGrid[0] - nextLocalX;
            this.dragY = this.lastMouseMovePositions.globalGrid[1] - nextLocalY;
        }

        this.createScaledGrid();
        this.refreshAllCells();
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

    // CONTROL

    public get controlPen() { return this.controlPenCode; }

    public set controlPen(val) {
        this.scheme.cancelProcesses();
        this.controlPenCode = val;
        if (this.allowedPrevCodes.includes(val)) {
            this.controlPenCodePrev = val;
        }

        if (CONF.ST_ROAD != val) {
            this.pointedCellZone.hideZone();
        }
        else {
            this.handleMouseMove(...this.lastMousePxGlobalPositions);
        }
    }

    public restoreControlPen() : void { this.controlPenCode = this.controlPenCodePrev; }

    public hidePointerZone() : void { this.pointedCellZone.hideZoneForever(); }

    public set controlEvent(val) {
        if (val in CONTROL_EVENTS_KEYS) {
            this.scheme[CONTROL_EVENTS_KEYS[val]]();
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
        this.refreshAllCells();
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
            let mult = Math.ceil(Math.abs(this.offsetX) / this.cellSizePx);
            let dir = this.offsetX < 0 ? mult : -1 * mult;
            cellsOffset[0] = dir;
            this.offsetX += dir * this.cellSizePx;
        }
        if (Math.abs(this.offsetY) > this.cellSizePx) {
            let mult = Math.ceil(Math.abs(this.offsetY) / this.cellSizePx);
            let dir = this.offsetY < 0 ? mult : -1 * mult;
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

        this.refreshAllCells();
    }

    setCenter() {
        this.dragX = this.dragY = this.scheme.sizeRadius;
        this.refreshAllCells();
    }

    // HANDLERS

    private lastMousePxGlobalPositions: Poss = [100, 100];
    private lastMouseMovePositions!: MousePossOnGrid;
    handleMouseMove(pxGlobalX: number, pxGlobalY: number) {
        this.lastMousePxGlobalPositions = [pxGlobalX, pxGlobalY]
        if (!this.mouseLock) {
            this.mouseLock = true;
            this.lastMouseMovePositions = this.globalPxToLocalCellPx(pxGlobalX, pxGlobalY);
            let zone = this.pointedCellZone.findOverZoneType(...this.lastMouseMovePositions.localCellPx);
            this.lastMouseMovePositions.zone = zone;
            if (this.controlPenCode == CONF.ST_ROAD) {
                this.pointedCellZone.showZone(zone, ...this.lastMouseMovePositions.localGrid);
            }
            this.scheme.setActiveCursorPosition(zone, ...this.lastMouseMovePositions.globalGrid);

            setTimeout(() => { this.mouseLock = false; }, CONF.NANO_MS);
        }
    }

    // CURSOR

    globalPxToLocalCellPx(pxGlobalX, pxGlobalY) : MousePossOnGrid {
        let localX = Math.floor((pxGlobalX - this.offsetX) / this.cellSizePx);
        let cellX = Math.floor((pxGlobalX - this.offsetX) - (localX * this.cellSizePx));
        let localY = Math.floor((pxGlobalY - this.offsetY) / this.cellSizePx);
        let cellY = Math.floor((pxGlobalY - this.offsetY) - (localY * this.cellSizePx));
        return {
            pxGlobal: [pxGlobalX, pxGlobalY],
            localGrid: [localX + CONF.GRID_OFFSET, localY + CONF.GRID_OFFSET],
            globalGrid: [localX + this.dragX, localY + this.dragY],
            localCellPx: [cellX, cellY],
        };
    }

    // VISIBLE GRID

    refreshCell(poss: IPoss) : void {
        let cell = this.getVisibleCell(this.schemeToVisiblePosition(poss));
        if (cell) {
            cell.refreshVisibleAll();
        }
    }
    refreshAllCells() : void {
        this.execForCells('refreshVisibleAll');
    }

    getVisibleCell(poss: IPoss) : CellGrid | null {
        if (poss.x >= 0 && poss.x < this.grid.length) {
            if (poss.y >= 0 && poss.y < this.grid[0].length) {
                return this.grid[poss.x][poss.y];
            }
        }
        return null;
    }

    schemeToVisiblePosition(poss: IPoss) : IPoss { return { x: poss.x - this.dragX + CONF.GRID_OFFSET, y: poss.y - this.dragY + CONF.GRID_OFFSET }; }

    // GETTERS

    get visibleCellsAreaCurrentWidth() : number { return this.grid.length; }
    get visibleCellsAreaCurrentHeight() : number { return this.grid[0].length; }

    get gridCellsAreaSize() : Size {
        return {
            width: CONF.GRID_OFFSET * 2 + this.htmlContainer.widthCells,
            height: CONF.GRID_OFFSET * 2 + this.htmlContainer.heightCells,
        };
    }
    get cellSizePx() : number { return this.htmlContainer.cellSizePx; }
}