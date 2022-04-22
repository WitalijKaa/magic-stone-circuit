class SchemeGrid extends Sprite {

    static GRID_OFFSET = 2; // to be little outsize visible screen area

    scheme;
    cells = [];
    visibleCells = [[]];

    offsetX = 0; offsetY = 0;

    needToResize = true;

    constructor(config) {
        super(config);

        this.sprite.interactive = true;
        this.sprite.hitArea = new PIXI.Rectangle(0, 0, 100000, 100000);

        this.scheme = Scheme.getNamedScheme(this.name);
        this.createVisibleGrid();

        new MouseDrag(this, { 'dragGrid': MouseDrag.DRAGGING_RIGHT });
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
        this.configParams.cell.name = 'x' + xCell + 'y' + yCell;
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

    execForVisibleCells(methods, params) {
        if ('string' == typeof methods) {
            methods = [methods];
        }
        if (!params) {
            params = {};
        }
        for (let xCell = 0; xCell < this.visibleCells.length; xCell++) {
            for (let yCell = 0; yCell < this.visibleCells[xCell].length; yCell++) {
                for (let ix = 0; ix < methods.length; ix++) {
                    this.visibleCells[xCell][yCell][methods[ix]](params);
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
        // console.log(x,y)
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