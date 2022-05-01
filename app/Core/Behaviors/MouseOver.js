class MouseOver {

    static MOUSE_OVER = 'mOver';

    model;
    events = {};

    constructor(model, config = {}) {
        this.model = model;
        this.model.sprite.on('mouseover', (event) => { this.handleMouseOver(event) });

        for (let eventName in config) {
            this.events[eventName] = (...args) => { this.model[config[eventName]](...args); }
        }
    }

    handleMouseOver(event) {
        if (this.events[this.constructor.MOUSE_OVER]) {
            this.events[this.constructor.MOUSE_OVER]();
        }
    }
}
