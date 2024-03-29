import {Sprite} from '@pixi/sprite';
import {TextureProvider} from "../Core/TextureProvider";
import {DisplayModel} from "./DisplayModel";
import {Colorizer} from "./Colorizer";
import {SchemeContainer} from "./Scheme/SchemeContainer";

export class SpriteModel extends DisplayModel {

    public model!: Sprite;

    private isPivotCenter: boolean = false;
    private isNormalSize: boolean = true;
    protected sizeOffset: number = 0;

    constructor(texture: null | string | Sprite = null) {
        super();
        if (!texture) { return; }
        if ('string' == typeof texture) {
            this.model = Sprite.from(texture);
        }
        else { this.model = texture; }
    }

    private static textureProvider
    public static injectTextureProvider(factory: TextureProvider) : void {
        this.textureProvider = factory;
    }

    public static from(name: string) : Sprite {
        return Sprite.from(this.textureProvider.get(name));
    }

    public changeTexture(name: string) {
        this.model.texture = SpriteModel.textureProvider.get(name);
    }

    public destroy() : void { this.model.destroy(); }

    // POSITIONing

    set centeredPivot(val: boolean) {
        if (this.isPivotCenter == val) { return; }
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

    set twiceSize(val: boolean) {
        if (this.isNormalSize != val) { return; }
        if (this.isNormalSize) {
            this.isNormalSize = false;
            this.model.anchor.set(1, 1);
            this.model.width = this.model.height = SchemeContainer.pxCell * 2;
            this.sizeOffset = SchemeContainer.pxCell;
            this.model.x += this.sizeOffset;
            this.model.y += this.sizeOffset;
        }
        else {
            this.isNormalSize = true;
            this.model.anchor.set(0, 0);
            this.model.width = this.model.height = SchemeContainer.pxCell;
            this.model.x -= this.sizeOffset;
            this.model.y -= this.sizeOffset;
            this.sizeOffset = 0;
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
    get w () : number {
        return this.model.width - this.sizeOffset;
    }
    get h () : number {
        return this.model.height - this.sizeOffset;
    }
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

    // COLORing

    private colorizer: Colorizer | null = null;

    public setColor(color: number | null) {
        if (color) {
            if (!this.colorizer) { this.colorizer = new Colorizer(this.model); }
            this.colorizer.setColor(color);
        }
        else if (this.colorizer) {
            this.colorizer.removeColor();
        }
    }
}