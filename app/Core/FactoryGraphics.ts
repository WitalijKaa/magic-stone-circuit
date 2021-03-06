import {TT} from "../config/textures";
import {Loader} from 'pixi.js';
import {Texture} from '@pixi/core';

export class FactoryGraphics {

    loader: Loader;
    resources: { [key: string]: Texture } = {};

    constructor() {
        this.loader = Loader.shared;
    }

    public loadTextures(onComplete) {
        for (let name in TT) {
            this.loader.add(name, TT[name]);
        }
        this.loader.onComplete.add((loader, resources) => {
            for (let name in TT) {
                // @ts-ignore
                this.resources[TT[name]] = resources[name].texture;
            }
        });

        this.loader.onComplete.add(onComplete);
        this.loader.load();
    }

    texture(name: string) : Texture {
        return this.resources[name]
    }
}