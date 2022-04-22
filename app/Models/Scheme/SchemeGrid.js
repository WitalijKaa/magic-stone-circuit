class SchemeGrid extends Sprite {

    cells = [];
    visibleCells = [];

    constructor(config) {
        super(config);
        this.resetVisibleGrid();
    }

    resetVisibleGrid() {
        for (let xCell = 0; xCell <= this.visibleCellsAreaSize.x; xCell++) {
            let column = [];
            for (let yCell = 0; yCell <= this.visibleCellsAreaSize.y; yCell++) {
                this.configParams.cell.name = 'x' + xCell + 'y' + yCell;
                let cellModel = Factory.sceneModel(this.configParams.cell)
                cellModel.setVisibleCellPosition(this.configParams.cellSizePx, xCell, yCell);
                column.push(cellModel);
                Scene.addModel(cellModel);
            }
            this.visibleCells.push(column);
        }
    }

    get visibleCellsAreaSize() {
        return { x: 25, y: 15 };
    }
}