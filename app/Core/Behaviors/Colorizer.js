class Colorizer {

    model;
    color = null;
    static matrix = {}

    constructor(model) {
        this.model = model;
    }

    setColor(color) {
        this.color = color;
        this.model.sprite.filters = [this.getColorMatrix()];
    }
    removeColor() {
        this.model.sprite.filters = [];
        this.color = null;
    }

    get isColorized() { return !!this.color; }

    getColorMatrix() {
        if (!this.constructor.matrix[this.constructor.matrixName(this.color)]) {
            let matrix = new PIXI.filters.ColorMatrixFilter();
            const tint = this.color;
            const r = tint >> 16 & 0xFF;
            const g = tint >> 8 & 0xFF;
            const b = tint & 0xFF;
            matrix.matrix[0] = r / 255;
            matrix.matrix[6] = g / 255;
            matrix.matrix[12] = b / 255;
            this.constructor.matrix[this.constructor.matrixName(this.color)] = matrix;
        }
        return this.constructor.matrix[this.constructor.matrixName(this.color)]
    }

    static matrixName(color) {
        return 'm' + color;
    }
}