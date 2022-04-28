class SchemeSemiconductor extends Sprite {

    cell;
    charge;

    constructor(config) {
        config.texture = SchemeSemiconductor.defineTextureByScheme(config.cell);
        super(config);
        this.cell = config.cell;
        this.colorizer = new Colorizer(this);
        this.colorizer.setColor(this.cell.semi.color);

        this.charge = Factory.sceneModel({
            model: Sprite,
            name: this.name + '|charge',
            texture: SchemeSemiconductor.defineTextureByScheme(config.cell, SEMICONDUCTOR_SPRITES_FLOW),
        });
        Scene.addModelToContainer(this.charge, this.cell);
        this.colorizerCharge = new Colorizer(this.charge);
        this.colorizerCharge.setColor(this.cell.semi.colorCharge);
    }

    refreshTexture() {
        this.colorizer.setColor(this.cell.semi.color);
        this.colorizerCharge.setColor(this.cell.semi.colorCharge);
    }

    static defineTextureByScheme(cell, spritesEnum = SEMICONDUCTOR_SPRITES) {
        let schemeSemiconductor = cell.scheme.findCellOrEmpty(...cell.schemePosition).semiconductor;
        return {
            path: spritesEnum[schemeSemiconductor.type],
            parentModel: cell,
            rotate: ROAD_COMMON_ROTATE[schemeSemiconductor.direction],
        }
    }
}