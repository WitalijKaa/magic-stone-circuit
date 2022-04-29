class SchemeSemiconductor extends Sprite {

    cell;
    flow;
    charge;

    constructor(config) {
        config.texture = SchemeSemiconductor.defineTextureByScheme(config.cell);
        super(config);
        this.cell = config.cell;
        this.colorizer = new Colorizer(this);
        this.colorizer.setColor(ROAD_TO_LIGHT_COLOR[this.cell.semi.colorAwake]);

        this.flow = Factory.sceneModel({
            model: Sprite,
            name: this.name + '|flow',
            texture: SchemeSemiconductor.defineTextureByScheme(config.cell, SEMICONDUCTOR_SPRITES_FLOW),
        });
        Scene.addModelToContainer(this.flow, this.cell);
        this.colorizerFlow = new Colorizer(this.flow);
        this.colorizerFlow.setColor(this.cell.semi.colorFlow);

        this.charge = Factory.sceneModel({
            model: Sprite,
            name: this.name + '|charge',
            texture: SchemeSemiconductor.defineTextureByScheme(config.cell, SEMICONDUCTOR_SPRITES_CHARGE),
        });
        Scene.addModelToContainer(this.charge, this.cell);
        this.colorizerCharge = new Colorizer(this.charge);
        this.colorizerCharge.setColor(ROAD_TO_LIGHT_COLOR[this.cell.semi.colorCharge]);
    }

    refreshTexture() {
        this.colorizer.setColor(ROAD_TO_LIGHT_COLOR[this.cell.semi.colorAwake]);
        this.colorizerFlow.setColor(this.cell.semi.colorFlow);
        this.colorizerCharge.setColor(ROAD_TO_LIGHT_COLOR[this.cell.semi.colorCharge]);
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