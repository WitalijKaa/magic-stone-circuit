import {textureTrick} from "../../config/textures";

export type SchemeScaleSize = 1 | 2 | 3 | 4;

export class SchemeContainer {

    constructor(private element: HTMLElement) {
        this.element = element;
    }

    private static scaleSize = 32;

    public changeScale(scale: SchemeScaleSize) {
        if (1 == scale) { SchemeContainer.scaleSize = 32; }
        if (2 == scale) { SchemeContainer.scaleSize = 16; }
        if (3 == scale) { SchemeContainer.scaleSize = 8; }
        textureTrick.changeSize(SchemeContainer.scaleSize);
    }

    public static get pxCell() : number { return SchemeContainer.scaleSize; }

    get cellSizePx() : number {
        return SchemeContainer.scaleSize;
    }
    get widthCells() : number {
        return Math.floor(this.element.offsetWidth / this.cellSizePx);
    }
    get heightCells() : number {
        return Math.floor( this.element.offsetHeight / this.cellSizePx);
    }
}