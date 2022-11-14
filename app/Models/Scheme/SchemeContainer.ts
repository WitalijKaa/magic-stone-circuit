export type SchemeScaleSize = 1 | 2 | 3 | 4;

export class SchemeContainer {

    constructor(private element: HTMLElement) {
        this.element = element;
    }

    private scaleSize = 40;

    public changeScale(scale: SchemeScaleSize) {
        if (1 == scale) { this.scaleSize = 40; }
        if (2 == scale) { this.scaleSize = 32; }
        if (3 == scale) { this.scaleSize = 16; }
        if (4 == scale) { this.scaleSize = 8; }
    }

    get cellSizePx() : number {
        return this.scaleSize;
    }
    get widthCells() : number {
        return Math.floor(this.element.offsetWidth / this.cellSizePx);
    }
    get heightCells() : number {
        return Math.floor( this.element.offsetHeight / this.cellSizePx);
    }
}