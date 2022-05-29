import {SpriteModel} from "../../Models/SpriteModel";
import {ContainerModel} from "../../Models/ContainerModel";

export class MouseOver {

    static MOUSE_OVER = 'mOver';
    static MOUSE_MOVE = 'mMove';

    model: SpriteModel | ContainerModel;
    events = {};

    constructor(model: SpriteModel | ContainerModel, subscriber: object, config: { [key: string]: string } = {}) {
        this.model = model;
        this.model.on('mouseover', (event) => { this.handleMouseOver(event) });
        this.model.on('mousemove', (event) => { this.handleMouseMove(event) });

        for (let eventName in config) {
            this.events[eventName] = (...args) => { subscriber[config[eventName]](...args); }
        }
    }

    handleMouseOver(event) {
        if (this.events[MouseOver.MOUSE_OVER]) {
            this.events[MouseOver.MOUSE_OVER]();
        }
    }

    handleMouseMove(event) {
        if (this.events[MouseOver.MOUSE_MOVE]) {
            this.events[MouseOver.MOUSE_MOVE](event.data.global.x, event.data.global.y);
        }
    }

}