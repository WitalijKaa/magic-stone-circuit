import * as CONF from "../../config/game";
import {SpriteModel} from "../../Models/SpriteModel";
import {ContainerModel} from "../../Models/ContainerModel";

export class MouseClick {

    static CLICK_RIGHT = 'cR';

    events = {};

    startRightX = 0; startRightY = 0;

    constructor(private model: SpriteModel | ContainerModel, subscriber: object, config: { [key: string]: string } = {}) {
        this.model = model;
        this.model.on('pointerdown', (event) => { this.handleMoveStart(event) });
        this.model.on('pointerup', (event) => { this.handleMoveEnd(event) });

        for (let eventName in config) {
            this.events[eventName] = (...args) => { subscriber[config[eventName]](...args); }
        }
    }

    handleMoveStart(event) {
        if (CONF.PIXI_MOUSE_RIGHT === event.data.button) {
            this.startRightX = Math.floor(event.data.global.x);
            this.startRightY = Math.floor(event.data.global.y);
        }
    }

    handleMoveEnd(event) {
        if (CONF.PIXI_MOUSE_RIGHT === event.data.button) {
            if (this.events[MouseClick.CLICK_RIGHT] &&
                this.startRightX === Math.floor(event.data.global.x) && this.startRightY === Math.floor(event.data.global.y))
            {
                this.events[MouseClick.CLICK_RIGHT]();
            }
            this.startRightX = this.startRightY = 0;
        }
    }
}