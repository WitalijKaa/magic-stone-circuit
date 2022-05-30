export class SchemeContainer {

    constructor(private element: HTMLElement) {
        this.element = element;
    }

    get cellSizePx() : number {
        return 40;
    }
    get widthCells() : number {
        return Math.floor(this.element.offsetWidth / this.cellSizePx);
    }
    get heightCells() : number {
        return Math.floor( this.element.offsetHeight / this.cellSizePx);
    }
}