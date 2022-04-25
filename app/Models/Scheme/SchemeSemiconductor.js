class SchemeSemiconductor extends Sprite {

    cell;

    constructor(config) {
        config.texture = SchemeSemiconductor.defineTextureByScheme(config.cell);
        super(config);
        this.cell = config.cell;
        this.colorizer = new Colorizer(this);
        this.colorizer.setColor(this.cell.colorOfSemiconductor);
    }

    refreshTexture() {
        let texture = this.constructor.defineTextureByScheme(this.cell);
        this.changeTexture(texture.path, this.cell, texture.rotate);
        this.colorizer.setColor(this.cell.colorOfSemiconductor);
    }

    static defineTextureByScheme(cell) {
        let schemeSemiconductor = cell.scheme.findCellOrEmpty(...cell.schemePosition).semiconductor;
        return {
            path: SEMICONDUCTOR_SPRITES[schemeSemiconductor.type],
            parentModel: cell,
            rotate: ROAD_COMMON_ROTATE[schemeSemiconductor.direction],
        }
    }
}