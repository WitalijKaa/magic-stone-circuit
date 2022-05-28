export class SchemeContainer {

    element: HTMLElement;

    constructor(element: HTMLElement) {
        this.element = element;
    }

    get widthPx() : number {
        return this.element.offsetWidth;
    }
    get heightPx() : number {
        return this.element.offsetHeight;
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