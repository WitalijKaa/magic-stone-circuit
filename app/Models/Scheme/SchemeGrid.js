class SchemeGrid extends Sprite {

    static START_TIMEOUT = 1000;
    static GRID_OFFSET = 2; // to be little outsize of the visible screen area

    scheme;
    visibleCells = [[]];

    offsetX = 0; offsetY = 0; // px offset on scroll
    dragX; dragY;

    mouseLock = false;

    needToResize = true;

    pointedCellZone;

    constructor(config) {
        super(config);

        this.dragX = this.dragY = Scheme.SIZE_RADIUS;

        this.sprite.interactive = true;
        this.sprite.hitArea = new PIXI.Rectangle(0, 0, 100000, 100000);

        this.scheme = Scheme.getNamedScheme(this.name);
        this.scheme.injectVisibleUpdate((x, y) => { this.refreshVisibleCell(x, y)});
        this.createVisibleGrid();

        setTimeout(() => { this.scheme.updateTick(); }, this.constructor.START_TIMEOUT);

        new MouseDrag(this, { [MouseDrag.DRAGGING_RIGHT]: 'dragGrid' });

        new MouseOver(this, { [MouseOver.MOUSE_MOVE]: 'handleMouseMove' });
        this.pointedCellZone = Factory.sceneModel(MM.cellPointer);
        this.pointedCellZone.init(this).setSize(this.cellPxSize);
        Scene.addModelToContainer(this.pointedCellZone, this);

        setTimeout(() => { this.execForVisibleCells('refreshVisibleAll') }, NANO_MS)
    }

    createVisibleGrid() {
        this.visibleCells = [];
        for (let xCell = 0; xCell < this.visibleCellsAreaSize.width; xCell++) {
            this.addCellsColumn(xCell);
        }
        this.execForVisibleCells('initNeighbors');
    }

    createVisibleCellsColumn(xCell) {
        let column = [];
        for (let yCell = 0; yCell < this.visibleCellsAreaSize.height; yCell++) {
            column.push(this.createVisibleCell(xCell, yCell));
        }
        return column;
    }

    createVisibleCell(xCell, yCell) {
        this.configParams.cell.name = xCell + '|' + yCell;
        let cellModel = Factory.sceneModel(this.configParams.cell)
        cellModel.init(this).setSize(this.cellPxSize).setPosition(xCell, yCell);
        Scene.addModelToContainer(cellModel, this);
        return cellModel;
    }

    getVisibleCell(xCell, yCell) {
        if (xCell >= 0 && xCell < this.visibleCells.length) {
            if (yCell >= 0 && yCell < this.visibleCells[0].length) {
                return this.visibleCells[xCell][yCell];
            }
        }
        return null;
    }

    refreshVisibleCell(xScheme, yScheme) {
        let cell = this.getVisibleCell(...this.schemeToVisiblePosition(xScheme, yScheme));
        if (cell) {
            cell.refreshVisibleAll();
        }
    }

    removeCellsRow() {
        for (let xCell = 0; xCell < this.visibleCells.length; xCell++) {
            let lastIX = this.visibleCells[xCell].length - 1;
            this.visibleCells[xCell][lastIX].sprite.destroy();
            this.visibleCells[xCell].pop();
        }
    }
    removeCellsColumn() {
        let lastIX = this.visibleCells.length - 1;
        for (let yCell = 0; yCell < this.visibleCells[lastIX].length; yCell++) {
            this.visibleCells[lastIX][yCell].sprite.destroy();
        }
        this.visibleCells.pop();
    }
    addCellsRow(skipLast = 0) {
        let yCell = this.visibleCells[0].length;
        for (let xCell = 0; xCell < this.visibleCells.length - skipLast; xCell++) {
            this.visibleCells[xCell].push(this.createVisibleCell(xCell, yCell));
        }
    }
    addCellsColumn() {
        this.visibleCells.push(this.createVisibleCellsColumn(this.visibleCells.length));
    }

    resetVisibleGrid() {
        while (this.visibleCellsAreaCurrentWidth > this.visibleCellsAreaSize.width) {
            this.removeCellsColumn();
        }
        while (this.visibleCellsAreaCurrentHeight > this.visibleCellsAreaSize.height) {
            this.removeCellsRow();
        }
        let columnAdded = 0;
        while (this.visibleCellsAreaCurrentWidth < this.visibleCellsAreaSize.width) {
            this.addCellsColumn();
            columnAdded++;
        }
        while (this.visibleCellsAreaCurrentHeight < this.visibleCellsAreaSize.height) {
            this.addCellsRow(columnAdded);
        }
        this.execForVisibleCells('initNeighbors');
    }

    execForVisibleCells(method, params = [], reverseMode = false) {
        if (!reverseMode) {
            for (let xCell = 0; xCell < this.visibleCells.length; xCell++) {
                for (let yCell = 0; yCell < this.visibleCells[xCell].length; yCell++) {
                    this.visibleCells[xCell][yCell][method](...params);
                }
            }
        }
        else {
            for (let xCell = this.visibleCells.length - 1; xCell >= 0; xCell--) {
                for (let yCell = this.visibleCells[xCell].length - 1; yCell >= 0; yCell--) {
                    this.visibleCells[xCell][yCell][method](...params);
                }
            }
        }
    }

    lastMouseMovePositions;
    handleMouseMove(pxGlobalX, pxGlobalY) {
        if (!this.mouseLock) {
            this.mouseLock = true;
            this.lastMouseMovePositions = this.globalPxToLocalCellPx(pxGlobalX, pxGlobalY);
            let zone = this.pointedCellZone.findOverZoneType(...this.lastMouseMovePositions.localCellPx);
            this.lastMouseMovePositions.zone = zone;
            if (ST_ROAD == Scene.controls.pen) {
                this.pointedCellZone.showZone(zone, ...this.lastMouseMovePositions.localGrid);
            }
            this.scheme.setActiveCursorPosition(zone, ...this.lastMouseMovePositions.globalGrid);

            setTimeout(() => { this.mouseLock = false;}, NANO_MS);
        }
    }

    dragGrid(x, y) {
        this.offsetX += x;
        this.offsetY += y;

        let cellsOffset = [0, 0];
        if (Math.abs(this.offsetX) > this.cellPxSize) {
            let dir = this.offsetX < 0 ? 1 : -1;
            cellsOffset[0] = dir;
            this.offsetX += dir * this.cellPxSize;
        }
        if (Math.abs(this.offsetY) > this.cellPxSize) {
            let dir = this.offsetY < 0 ? 1 : -1;
            cellsOffset[1] = dir;
            this.offsetY += dir * this.cellPxSize;
        }
        this.visibleCellsOffset(...cellsOffset);

        this.execForVisibleCells('updatePosition');
    }

    visibleCellsOffset(x, y) {
        if (!x && !y) { return; }

        this.dragX += x; // todo out of diameter
        this.dragY += y;

        this.execForVisibleCells('refreshVisibleAll');
    }

    globalPxToLocalCellPx(pxGlobalX, pxGlobalY) {
        let localX = Math.floor((pxGlobalX - this.offsetX) / this.cellPxSize);
        let cellX = Math.floor((pxGlobalX - this.offsetX) - (localX * this.cellPxSize));
        let localY = Math.floor((pxGlobalY - this.offsetY) / this.cellPxSize);
        let cellY = Math.floor((pxGlobalY - this.offsetY) - (localY * this.cellPxSize));
        return {
            localGrid: [localX + SchemeGrid.GRID_OFFSET, localY + SchemeGrid.GRID_OFFSET],
            globalGrid: [localX + this.dragX, localY + this.dragY],
            localCellPx: [cellX, cellY],
        };
    }

    schemeToVisiblePosition(x, y) { return [x - this.dragX + this.constructor.GRID_OFFSET, y - this.dragY + this.constructor.GRID_OFFSET]; }

    get visibleCellsAreaSize() {
        return {
            width: this.constructor.GRID_OFFSET * 2 + Math.floor(Scene.widthPx / this.cellPxSize),
            height: this.constructor.GRID_OFFSET * 2 + Math.floor(Scene.heightPx / this.cellPxSize)
        };
    }

    get cellPxSize() {
        if (this.needToResize) {
            this._cellPxSize = Math.floor(this.configParams.cellSizePx / this.scheme.ratio)
            this.cellPxSizeConfig = {
                lineA: Math.floor(this._cellPxSize / 3),
                lineB: Math.floor(this._cellPxSize / 3) + Math.floor(this._cellPxSize / 3),
            };
            this.needToResize = false; // todo
        }
        return this._cellPxSize;
    }
    cellPxSizeConfig = {};

    get visibleCellsAreaCurrentWidth() { return this.visibleCells.length; }
    get visibleCellsAreaCurrentHeight() { return this.visibleCells[0].length; }

    get resizeCallbacks() { return [
        () => { this.resetVisibleGrid(); },
    ]; }
}