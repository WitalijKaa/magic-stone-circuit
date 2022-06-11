//import {SpriteModel} from "./SpriteModel";
//import type { Filter } from '@pixi/core';
//import * as PIXI from 'pixi.js';
import {ColorMatrixFilter} from '@pixi/filter-color-matrix';
import {Sprite} from "pixi.js";
//import { Application as PixiApplication } from 'pixi.js';

export class Colorizer {

    private color: number | null = null;
    private static matrix: {[key: string]: ColorMatrixFilter} = {}

    constructor(private model: Sprite) { }

    public setColor(color: number) : void {
        this.color = color;
        this.model.filters = this.getColorMatrix();
    }

    public removeColor() : void {
        this.model.filters = null;
        this.color = null;
    }

    get isColorized() : boolean { return !!this.color; }

    getColorMatrix() : Array<ColorMatrixFilter> | null {
        if (!this.color) { return null; }

        if (!Colorizer.matrix[Colorizer.matrixName(this.color)]) {
            let matrix = new ColorMatrixFilter();
            const tint = this.color;
            const r = tint >> 16 & 0xFF;
            const g = tint >> 8 & 0xFF;
            const b = tint & 0xFF;
            matrix.matrix[0] = r / 255;
            matrix.matrix[6] = g / 255;
            matrix.matrix[12] = b / 255;
            Colorizer.matrix[Colorizer.matrixName(this.color)] = matrix;
        }
        return [Colorizer.matrix[Colorizer.matrixName(this.color)]];
    }

    static matrixName(color: number) : string {
        return 'm' + color;
    }
}