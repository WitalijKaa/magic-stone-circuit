class SchemeSemiconductor extends Sprite {

    cell;
    flow;
    charge;
    
    lastSemiParams;

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
        
        this.lastSemiParams = {
            type: this.cell.semi.type,
            direction: this.cell.semi.direction,
        }
    }

    refreshTexture() {
        let semi = this.cell.semi;
        if (semi.type != this.lastSemiParams.type || semi.direction != this.lastSemiParams.direction) {
            let texture = SchemeSemiconductor.defineTextureByScheme(this.cell);
            this.changeTexture(texture.path, texture.parentModel, texture.rotate)
            texture = SchemeSemiconductor.defineTextureByScheme(this.cell, SEMICONDUCTOR_SPRITES_FLOW);
            this.flow.changeTexture(texture.path, texture.parentModel, texture.rotate)
            texture = SchemeSemiconductor.defineTextureByScheme(this.cell, SEMICONDUCTOR_SPRITES_CHARGE);
            this.charge.changeTexture(texture.path, texture.parentModel, texture.rotate)

            this.lastSemiParams = {
                type: semi.type,
                direction: semi.direction,
            }
        }
        
        this.colorizer.setColor(ROAD_TO_LIGHT_COLOR[this.cell.semi.colorAwake]);
        this.colorizerFlow.setColor(this.cell.semi.colorFlow);
        this.colorizerCharge.setColor(ROAD_TO_LIGHT_COLOR[this.cell.semi.colorCharge]);
    }

    static defineTextureByScheme(cell, spritesEnum = SEMICONDUCTOR_SPRITES) {
        let semi = cell.scheme.findCellOrEmpty(...cell.schemePosition).semiconductor;
        return {
            path: spritesEnum[semi.type],
            parentModel: cell,
            rotate: ROAD_COMMON_ROTATE[semi.direction],
        }
    }
}