import * as CONF from "../../config/game";
import {SpriteModel} from "../../Models/SpriteModel";
import {ContainerModel} from "../../Models/ContainerModel";
import {HH} from "../HH";

export class MouseClick {

    static CLICK_RIGHT = 'cR';
    static TOO_MUCH_MOVE = 5;
    static TOO_MUCH_SECs = 2;

    private events: {[key: string]: (...args) => void} = {};

    private startRightX: number = 0;
    private startRightY: number = 0;
    private toMuchMove: boolean = false;
    private startTime: number = 0;
    private toMuchTime: boolean = false;

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
        if (CONF.PIXI_MOUSE_RIGHT === event.data.button) {
            this.startRightX = Math.floor(event.data.global.x);
            this.startRightY = Math.floor(event.data.global.y);
            this.startTime = HH.timestamp();
            this.toMuchMove = false;
        }
    }

    handleMoveEnd(event) {
        if (CONF.PIXI_MOUSE_RIGHT === event.data.button) {
            if (this.events[MouseClick.CLICK_RIGHT] &&
                !this.toMuchMove && !this.isTimeToMuch)
            {
                this.events[MouseClick.CLICK_RIGHT]();
            }
            this.startRightX = this.startRightY = 0;
        }
    }

    handleMove(event) {
        if (this.toMuchMove || this.toMuchTime) { return; }
        if (Math.abs(this.startRightX - Math.floor(event.data.global.x)) > MouseClick.TOO_MUCH_MOVE ||
            Math.abs(this.startRightY - Math.floor(event.data.global.y)) > MouseClick.TOO_MUCH_MOVE) {
            this.toMuchMove = true;
        }
    }

    get isTimeToMuch () : boolean {
        if (this.toMuchTime) { return true; }
        if (HH.timestamp() - this.startTime >= MouseClick.TOO_MUCH_SECs) { return true; }
        return false;
    }
}