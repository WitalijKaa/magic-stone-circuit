import { Sprite, Texture } from 'pixi.js';
import {FactoryGraphics} from "../Core/FactoryGraphics";

export class SpriteModel {

    model: Sprite;

    constructor(texture: string | Sprite) {
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

    get x () : number { return this.model.x; }
    get y () : number { return this.model.y; }
    get w () : number { return this.model.width; }
    get h () : number { return this.model.height; }
    set x (val: number) { this.model.x = val; }
    set y (val: number) { this.model.y = val; }
    set w (val: number) { this.model.width = val; }
    set h (val: number) { this.model.height = val; }
}