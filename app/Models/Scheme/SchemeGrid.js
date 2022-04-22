class SchemeGrid extends Sprite {

    static GRID_OFFSET = 2; // to be little outsize of the visible screen area

    scheme;
    visibleCells = [[]];

    offsetX = 0; offsetY = 0; // px offset on scroll
    dragX; dragY;

    needToResize = true;

    constructor(config) {
        super(config);

        this.dragX = this.dragY = Scheme.SIZE_RADIUS;

        this.sprite.interactive = true;
        this.sprite.hitArea = new PIXI.Rectangle(0, 0, 100000, 100000);

        this.scheme = Scheme.getNamedScheme(this.name);
        this.createVisibleGrid();

        new MouseDrag(this, { [MouseDrag.DRAGGING_RIGHT]: 'dragGrid' });
    }

    createVisibleGrid() {
        this.visibleCells = [];
        for (let xCell = 0; xCell < this.visibleCellsAreaSize.width; xCell++) {
            this.addCellsColumn(xCell);
        }
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
        cellModel.init(this);
        cellModel.setSize(this.cellPxSize);
        cellModel.setPosition(xCell, yCell);
        Scene.addModelToContainer(cellModel, this);
        return cellModel;
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
        while (this.visibleCellsWidth > this.visibleCellsAreaSize.width) {
            this.removeCellsColumn();
        }
        while (this.visibleCellsHeight > this.visibleCellsAreaSize.height) {
            this.removeCellsRow();
        }
        let columnAdded = 0;
        while (this.visibleCellsWidth < this.visibleCellsAreaSize.width) {
            this.addCellsColumn();
            columnAdded++;
        }
        while (this.visibleCellsHeight < this.visibleCellsAreaSize.height) {
            this.addCellsRow(columnAdded);
        }
    }

    execForVisibleCells(methods, params = [], reverseMode = false) {
        if ('string' == typeof methods) {
            methods = [methods];
        }
        if (!reverseMode) {
            for (let xCell = 0; xCell < this.visibleCells.length; xCell++) {
                for (let yCell = 0; yCell < this.visibleCells[xCell].length; yCell++) {
                    for (let ix = 0; ix < methods.length; ix++) {
                        this.visibleCells[xCell][yCell][methods[ix]](...params);
                    }
                }
            }
        }
        else {
            for (let xCell = this.visibleCells.length - 1; xCell >= 0; xCell--) {
                for (let yCell = this.visibleCells[xCell].length - 1; yCell >= 0; yCell--) {
                    for (let ix = 0; ix < methods.length; ix++) {
                        this.visibleCells[xCell][yCell][methods[ix]](...params);
                    }
                }
            }
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

        if (x) {
            this.execForVisibleCells(
                (x > 0) ? 'moveLeft' : 'moveRight',
                [false],
                !(x > 0),
            );
        }
        this.dragX += x; // todo out of diameter

        if (y) {
            this.execForVisibleCells(
                (y > 0) ? 'moveUp' : 'moveDown',
                [false],
                !(y > 0),
            );
        }
        this.dragY += y; // todo out of diameter
    }

    get visibleCellsAreaSize() {
        return {
            width: SchemeGrid.GRID_OFFSET * 2 + Math.floor(Scene.widthPx / this.cellPxSize),
            height: SchemeGrid.GRID_OFFSET * 2 + Math.floor(Scene.heightPx / this.cellPxSize)
        };
    }

    get cellPxSize() {
        if (this.needToResize) {
            this._cellPxSize = Math.floor(this.configParams.cellSizePx / this.scheme.ratio)
            this.needToResize = false; // todo
        }
        return this._cellPxSize;
    }

    get visibleCellsWidth() { return this.visibleCells.length; }
    get visibleCellsHeight() { return this.visibleCells[0].length; }

    get resizeCallbacks() { return [
        () => { this.resetVisibleGrid(); },
    ]; }
}