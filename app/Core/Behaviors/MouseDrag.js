class MouseDrag {

    static DRAGGING_RIGHT = 'dragR';

    model;
    events = {};

    isDrag = false;
    button;
    startX; startY;
    draggedX; draggedY;

    constructor(model, config = {}) {
        this.model = model;
        this.model.sprite.on('pointerdown', (event) => { this.handleMoveStart(event) });
        this.model.sprite.on('pointermove', (event) => { this.handleMove(event) });
        this.model.sprite.on('pointerup', (event) => { this.handleMoveEnd(event) });

        for (let eventName in config) {
            this.events[eventName] = (...args) => { this.model[config[eventName]](...args); }
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