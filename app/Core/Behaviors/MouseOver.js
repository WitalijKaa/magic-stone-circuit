class MouseOver {

    static MOUSE_OVER = 'mOver';
    static MOUSE_MOVE = 'mMove';

    model;
    events = {};

    constructor(model, config = {}) {
        this.model = model;
        this.model.sprite.on('mouseover', (event) => { this.handleMouseOver(event) });
        this.model.sprite.on('mousemove', (event) => { this.handleMouseMove(event) });

        for (let eventName in config) {
            this.events[eventName] = (...args) => { this.model[config[eventName]](...args); }
        }
    }

    handleMouseOver(event) {
        if (this.events[this.constructor.MOUSE_OVER]) {
            this.events[this.constructor.MOUSE_OVER]();
        }
    }

    handleMouseMove(event) {
        if (this.events[this.constructor.MOUSE_MOVE]) {
            this.events[this.constructor.MOUSE_MOVE](event.data.global.x, event.data.global.y);
        }
    }
}
