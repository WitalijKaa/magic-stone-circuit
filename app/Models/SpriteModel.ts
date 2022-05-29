import {Sprite} from 'pixi.js';
import {FactoryGraphics} from "../Core/FactoryGraphics";
import {DisplayModel} from "./DisplayModel";

export class SpriteModel extends DisplayModel {

    model: Sprite;
    isPivotCenter: boolean = false;

    constructor(texture: string | Sprite) {
        super();
        if ('string' == typeof texture) {
            this.model = Sprite.from(texture);
        }
        else {
            this.model = texture;
        }
    }

    private static factoryGraphics
    public static implementGraphics(factory: FactoryGraphics) : void {
        this.factoryGraphics = factory;
    }

    public static from(name: string) : Sprite {
        return Sprite.from(this.factoryGraphics.texture(name));
    }

    public destroy() : void { this.model.destroy(); }

    set centeredPivot(val: boolean) {
        this.isPivotCenter = val;
        if (val) {
            this.model.anchor.set(0.5, 0.5);
            //this.model.pivot.set(this.model.width / 2, this.model.height / 2);
            this.x = this.model.x;
            this.y = this.model.y;
        }
        else {
            // todo this.model.anchor.set(0, 0);
        }
    }

    get x () : number {
        if (this.isPivotCenter) {
            return this.model.x - this.model.width / 2;
        }
        else {
            return this.model.x;
        }
    }
    get y () : number {
        if (this.isPivotCenter) {
            return this.model.y - this.model.height / 2;
        }
        else {
            return this.model.y;
        }
    }
    get w () : number { return this.model.width; }
    get h () : number { return this.model.height; }
    set x (val: number) {
        if (this.isPivotCenter) {
            this.model.x = val + this.model.width / 2;
        }
        else {
            this.model.x = val;
        }
    }
    set y (val: number) {
        if (this.isPivotCenter) {
            this.model.y = val + this.model.height / 2;
        }
        else {
            this.model.y = val;
        }
    }
    set w (val: number) { this.model.width = val; }
    set h (val: number) { this.model.height = val; }
}