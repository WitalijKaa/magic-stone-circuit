class MouseClick {

    static CLICK_RIGHT = 'cR';

    model;
    events = {};

    startRightX; startRightY;

    constructor(model, config = {}) {
        this.model = model;
        this.model.sprite.on('pointerdown', (event) => { this.handleMoveStart(event) });
        this.model.sprite.on('pointerup', (event) => { this.handleMoveEnd(event) });

        for (let eventName in config) {
            this.events[eventName] = (...args) => { this.model[config[eventName]](...args); }
        }
    }

    handleMoveStart(event) {
        if (PIXI_MOUSE_RIGHT === event.data.button) {
            this.startRightX = Math.floor(event.data.global.x);
            this.startRightY = Math.floor(event.data.global.y);
        }
    }

    handleMoveEnd(event) {
        if (PIXI_MOUSE_RIGHT === event.data.button) {
            if (this.events[this.constructor.CLICK_RIGHT] &&
                this.startRightX === Math.floor(event.data.global.x) && this.startRightY === Math.floor(event.data.global.y))
            {
                this.events[this.constructor.CLICK_RIGHT]();
            }
            this.startRightX = this.startRightY = null;
        }
    }
}