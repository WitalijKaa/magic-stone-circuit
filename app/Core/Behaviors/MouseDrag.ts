import { PIXI_MOUSE_RIGHT } from "../../config/pixi";
import {SpriteModel} from "../../Models/SpriteModel";
import {ContainerModel} from "../../Models/ContainerModel";

export class MouseDrag {

    static DRAGGING_RIGHT = 'dragR';

    events = {};

    isDrag = false;
    button;
    startX!: number; startY!: number;
    draggedX!: number; draggedY!: number;

    constructor(private model: SpriteModel | ContainerModel, subscriber: object, config: { [key: string]: string } = {}) {
        this.model = model;
        this.model.on('pointerdown', (event) => { this.handleMoveStart(event) });
        this.model.on('pointermove', (event) => { this.handleMove(event) });
        this.model.on('pointerup', (event) => { this.handleMoveEnd(event) });

        for (let eventName in config) {
            this.events[eventName] = (...args) => { subscriber[config[eventName]](...args); }
        }
    }

    handleMoveStart(event) {
        if (!this.isDrag) {
            this.isDrag = true;
            this.button = event.data.button;
            this.startX = event.data.global.x;
            this.startY = event.data.global.y;
            this.draggedX = this.draggedY = 0;
        }
    }

    handleMove(event) {
        if (this.isDrag) {
            if (PIXI_MOUSE_RIGHT === this.button && this.events[MouseDrag.DRAGGING_RIGHT]) {
                let changeX = Math.floor(event.data.global.x - this.startX);
                let changeY = Math.floor(event.data.global.y - this.startY);

                let dragX = changeX - this.draggedX;
                let dragY = changeY - this.draggedY;
                this.events[MouseDrag.DRAGGING_RIGHT](dragX, dragY);
                this.draggedX += dragX;
                this.draggedY += dragY;
            }
        }
    }

    handleMoveEnd(event) {
        if (this.isDrag) {
            this.isDrag = false;
        }
    }
}