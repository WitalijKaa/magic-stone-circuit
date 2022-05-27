class CellScheme {

    cellPosition: Cell;
    scheme: Scheme;

    constructor(x: number, y: number, scheme: Scheme) {
        this.cellPosition = new Cell(x, y);
        this.scheme = scheme;
    }

    get x() : number { return this.cellPosition.x; }
    get y() : number { return this.cellPosition.y; }

    get up() : CellScheme { return this.scheme.getCell(this.cellPosition.up); }
    get right() : CellScheme { return this.scheme.getCell(this.cellPosition.right); }
    get down() : CellScheme { return this.scheme.getCell(this.cellPosition.down); }
    get left() : CellScheme { return this.scheme.getCell(this.cellPosition.left); }
}