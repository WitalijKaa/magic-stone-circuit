import * as CONF from "../../config/game";
import {CellGrid} from "./CellGrid";
import {CellSemiconductor as SchemeSemi, CellSemiconductorType, SemiColor} from "../../Core/Types/CellSemiconductor";
import {TT} from "../../config/textures";
import {
    COLOR_INDIGO_ROAD, COLOR_ORANGE_ROAD,
    COLOR_RED_ROAD,
    COLOR_VIOLET_ROAD,
    PIXI_ROTATE_LEFT,
    ROAD_PATH_DOWN,
    ROAD_PATH_UP,
    ST_ROAD_AWAKE,
    ST_ROAD_SLEEP, ST_STONE_INDIGO, ST_STONE_ORANGE, ST_STONE_RED,
    ST_STONE_VIOLET
} from "../../config/game";
import {SpriteModel} from "../SpriteModel";
import {HH} from "../../Core/HH";

type SpriteType = 'awake' | 'charge' | 'flow';
const SEMICONDUCTOR_SPRITES = {
    'awake': {
        [ST_ROAD_SLEEP]: TT.roadSleep,
        [ST_ROAD_AWAKE]: TT.roadAwakening,
    },
    'charge': {
        [ST_ROAD_SLEEP]: TT.roadSleepCharge,
        [ST_ROAD_AWAKE]: TT.roadAwakeningCharge,
    },
} as const;

const FLOW_SPRITES = {
    [ST_ROAD_SLEEP]: [TT.sleepFlow, TT.sleepFlowV, TT.sleepFlowR, TT.sleepFlowI, TT.sleepFlowO],
    [ST_ROAD_AWAKE]: [TT.semiFlow, TT.semiFlowV, TT.semiFlowR, TT.semiFlowI, TT.semiFlowO],
};

export class CellSemiconductor {

    private semiconductorDrawn: CellSemiconductorType | null = null;
    private awake!: SpriteModel;
    private charge!: SpriteModel;

    private flowType: number = 0;

    constructor(private cell: CellGrid) { }

    public updateVisibleSemiconductor() : void {
        let semi = this.cell.schemeCell?.semiconductor
        if (semi) {
            for (let spriteType in SEMICONDUCTOR_SPRITES) {
                this.initSprite(spriteType as SpriteType, semi);
                let model: SpriteModel = this[spriteType];

                this.cell.model.addChild(model.model);
                model.model.angle = CONF.ROAD_COMMON_ROTATE[semi.direction];
                model.setColor(semi['color' + HH.ucfirst(spriteType)] as SemiColor)
            }

            this.semiconductorDrawn = semi.type;
        }
        else if (this.semiconductorDrawn) {
            for (let spriteType in SEMICONDUCTOR_SPRITES) {
                if (this[spriteType]) {
                    this[spriteType].destroy();
                }
                this[spriteType] = null;
            }
            this.cell.changeTexture(CellGrid.defaultTexture);
            this.semiconductorDrawn = null;
        }
    }

    private initSprite(spriteType: SpriteType, schemeSemi: SchemeSemi) : void {
        if (!this[spriteType]) {
            this.cell.changeTexture(FLOW_SPRITES[schemeSemi.type][this.colorToIx(schemeSemi.colorFlow)]);

            this[spriteType] = new SpriteModel(SEMICONDUCTOR_SPRITES[spriteType][schemeSemi.type]);
            this[spriteType].centeredPivot = true;
            this.cell.model.addChild(this[spriteType].model);
        }
        else if (this.semiconductorDrawn != schemeSemi.type) {
            this.cell.changeTexture(FLOW_SPRITES[schemeSemi.type][this.colorToIx(schemeSemi.colorFlow)]);

            this[spriteType].changeTexture(SEMICONDUCTOR_SPRITES[spriteType][schemeSemi.type]);
        }
        else if (this.flowType != this.colorToIx(schemeSemi.colorFlow)) {
            this.cell.changeTexture(FLOW_SPRITES[schemeSemi.type][this.colorToIx(schemeSemi.colorFlow)]);
        }
        this.flowType = this.colorToIx(schemeSemi.colorFlow);
    }

    private colorToIx(color: SemiColor) : number {
        console.log('colorToIx', color)
        if (!color) { return 0; }
        return CONF.COLOR_TO_STONE_TYPE[color];
    }
}