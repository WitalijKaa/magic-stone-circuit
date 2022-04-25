class SchemeSemiconductor extends Sprite {

    cell;

    constructor(config) {
        config.texture = SchemeSemiconductor.defineTextureByScheme(config.cell);
        super(config);
        this.cell = config.cell;
    }

    refreshTexture() {
        let texture = this.constructor.defineTextureByScheme(this.cell);
        this.changeTexture(texture.path, this.cell, texture.rotate);
    }

    static defineTextureByScheme(cell) {
        let schemeSemiconductor = cell.scheme.findCellOrEmpty(...cell.schemePosition).semiconductor;
        if (ST_ROAD_SLEEP == schemeSemiconductor.type) {
            return {
                path: SEMICONDUCTOR_SPRITES[schemeSemiconductor.type],
                parentModel: cell,
                rotate: ROAD_COMMON_ROTATE[schemeSemiconductor.direction],
            }
        }
    }
}