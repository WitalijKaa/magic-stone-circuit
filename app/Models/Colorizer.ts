import {ColorMatrixFilter} from '@pixi/filter-color-matrix';
import {Sprite} from '@pixi/sprite';

export class Colorizer {

    private color: number | null = null;
    private static matrix: {[key: number]: ColorMatrixFilter} = {}

    constructor(private model: Sprite) { }

    public setColor(color: number) : void {
        this.color = color;
        this.model.filters = this.getColorMatrix();
    }

    public removeColor() : void {
        this.model.filters = null; // todo remove only this color
        this.color = null;
    }

    private getColorMatrix() : Array<ColorMatrixFilter> | null {
        if (!this.color) { return null; }

        if (!Colorizer.matrix[this.color]) {
            let matrix = new ColorMatrixFilter();
            const tint = this.color;
            const r = tint >> 16 & 0xFF;
            const g = tint >> 8 & 0xFF;
            const b = tint & 0xFF;
            matrix.matrix[0] = r / 255;
            matrix.matrix[6] = g / 255;
            matrix.matrix[12] = b / 255;

            Colorizer.matrix[this.color] = matrix;
        }
        return [Colorizer.matrix[this.color]];
    }
}