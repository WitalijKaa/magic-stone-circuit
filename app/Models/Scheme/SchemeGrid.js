class SchemeGrid extends Sprite {

    scheme;
    cells = [];
    visibleCells = [];

    offsetX = 0; offsetY = 0;

    constructor(config) {
        super(config);

        this.sprite.interactive = true;
        this.sprite.hitArea = new PIXI.Rectangle(0, 0, 100000, 100000);

        this.scheme = Scheme.getNamedScheme(this.name);
        this.resetVisibleGrid();

        new MouseDrag(this, { 'dragGrid': MouseDrag.DRAGGING_RIGHT });
    }

    resetVisibleGrid() {
        for (let xCell = 0; xCell <= this.visibleCellsAreaSize.x; xCell++) {
            let column = [];
            for (let yCell = 0; yCell <= this.visibleCellsAreaSize.y; yCell++) {
                this.configParams.cell.name = 'x' + xCell + 'y' + yCell;
                let cellModel = Factory.sceneModel(this.configParams.cell)
                cellModel.init(this);
                cellModel.setSize(this.configParams.cellSizePx);
                cellModel.setPosition(xCell, yCell);
                column.push(cellModel);
                Scene.addModelToContainer(cellModel, this);
            }
            this.visibleCells.push(column);
        }
    }

    execForVisibleCells(methods, params) {
        if ('string' == typeof methods) {
            methods = [methods];
        }
        if (!params) {
            params = {};
        }
        for (let xCell = 0; xCell <= this.visibleCellsAreaSize.x; xCell++) {
            for (let yCell = 0; yCell <= this.visibleCellsAreaSize.y; yCell++) {
                for (let ix = 0; ix < methods.length; ix++) {
                    this.visibleCells[xCell][yCell][methods[ix]](params);
                }
            }
        }
    }

    dragGrid(x, y) {
        this.offsetX += x;
        this.offsetY += y;
        this.execForVisibleCells('updatePosition');
    }

    get visibleCellsAreaSize() {
        return { x: 25, y: 15 };
    }

    get cellPxSize() {
        return this.configParams.cellSizePx / this.scheme.ratio;
    }
}