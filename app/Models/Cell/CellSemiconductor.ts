import * as CONF from "../../config/game";
import {CellGrid} from "./CellGrid";
import {CellSemiconductor as SchemeSemi, CellSemiconductorType, SemiColor} from "../../Core/Types/CellSemiconductor";
import {TT} from "../../config/textures";
import {PIXI_ROTATE_LEFT, ROAD_PATH_DOWN, ROAD_PATH_UP, ST_ROAD_AWAKE, ST_ROAD_SLEEP} from "../../config/game";
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
    'flow': {
        [ST_ROAD_SLEEP]: TT.roadSleepFlow,
        [ST_ROAD_AWAKE]: TT.roadAwakeningFlow,
    },
} as const;

export class CellSemiconductor {

    private semiconductorDrawn: CellSemiconductorType | null = null;
    private awake!: SpriteModel;
    private flow!: SpriteModel;
    private charge!: SpriteModel;

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
            this.semiconductorDrawn = null;
        }
    }

    private initSprite(spriteType: SpriteType, schemeSemi: SchemeSemi) : void {
        if (!this[spriteType]) {
            this[spriteType] = new SpriteModel(SEMICONDUCTOR_SPRITES[spriteType][schemeSemi.type]);
            this[spriteType].centeredPivot = true;
            this.cell.model.addChild(this[spriteType].model);
        }
        else if (this.semiconductorDrawn != schemeSemi.type) {
            this[spriteType].changeTexture(SEMICONDUCTOR_SPRITES[spriteType][schemeSemi.type]);
        }
    }
}