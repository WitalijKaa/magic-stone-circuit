import {textureTrick} from "../config/textures";
import {Loader} from 'pixi.js';
import {Texture} from '@pixi/core';

export class TextureProvider {

    loader: Loader;
    resources: { [key: string]: Texture } = {};

    constructor() {
        this.loader = Loader.shared;
    }

    public loadTextures(onComplete) {
        let textures = textureTrick.getAll();

        for (let name in textures) {
            this.loader.add(name, textures[name]);
        }
        this.loader.onComplete.add((loader, resources) => {
            for (let name in textures) {
                // @ts-ignore
                this.resources[textures[name]] = resources[name].texture;
            }
        });

        this.loader.onComplete.add(onComplete);
        this.loader.load();
    }

    public get(name: string) : Texture {
        return this.resources[name]
    }
}