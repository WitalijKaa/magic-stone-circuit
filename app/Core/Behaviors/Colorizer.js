class Colorizer {

    model;
    static matrix = {}

    constructor(model) {
        this.model = model;
    }

    setColor(color) {
        this.model.sprite.filters = [this.getColorMatrix(color)];
    }

    getColorMatrix(color) {
        if (!this.constructor.matrix[this.constructor.matrixName(color)]) {
            let matrix = new PIXI.filters.ColorMatrixFilter();
            const tint = color;
            const r = tint >> 16 & 0xFF;
            const g = tint >> 8 & 0xFF;
            const b = tint & 0xFF;
            matrix.matrix[0] = r / 255;
            matrix.matrix[6] = g / 255;
            matrix.matrix[12] = b / 255;
            this.constructor.matrix[this.constructor.matrixName(color)] = matrix;
        }
        return this.constructor.matrix[this.constructor.matrixName(color)]
    }

    static matrixName(color) {
        return 'm' + color;
    }
}