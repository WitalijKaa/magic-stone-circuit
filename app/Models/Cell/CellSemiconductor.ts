import * as CONF from "../../config/game";
import {CellGrid} from "./CellGrid";
import {CellSemiconductor as SchemeSemi, CellSemiconductorType, SemiColor} from "../../Core/Types/CellSemiconductor";
import {TT} from "../../config/textures";
import { ST_ROAD_AWAKE, ST_ROAD_SLEEP } from "../../config/game";
import {SpriteModel} from "../SpriteModel";

type SpriteType = 'Awake' | 'Charge' | 'Flow';

const TYPE_TO_VAR = {
    [ST_ROAD_SLEEP]: 'sleep',
    [ST_ROAD_AWAKE]: 'semi',
} as const;

const COLOR_TO_VAR = ['', 'V', 'R', 'I', 'O'];

const ADDITIONAL_SPRITES = ['Awake', 'Charge'];

export class CellSemiconductor {

    private semiconductorDrawn: CellSemiconductorType | null = null;
    private Awake!: SpriteModel;
    private Charge!: SpriteModel;

    private flowRotate: number = 0;
    private tFlow: number = 0;
    private tAwake: number = 0;
    private tCharge: number = 0;

    constructor(private cell: CellGrid) { }

    public updateVisibleSemiconductor() : void {
        let semi = this.cell.schemeCell?.semiconductor
        if (semi) {
            this.showFlow(semi);
            for (let spriteType of ADDITIONAL_SPRITES) {
                this.showSprite(spriteType as SpriteType, semi);
            }
            this.semiconductorDrawn = semi.type;
        }
        else if (this.semiconductorDrawn) {
            for (let spriteType of ADDITIONAL_SPRITES) {
                if (this[spriteType]) {
                    this[spriteType].destroy();
                }
                this[spriteType] = null;
            }
            this.cell.changeTexture(CellGrid.defaultTexture);
            this.semiconductorDrawn = null;
        }
    }

    private showFlow(schemeSemi: SchemeSemi) : void {
        if (!this.semiconductorDrawn ||
            this.semiconductorDrawn != schemeSemi.type ||
            this.tFlow != this.colorToIx(schemeSemi.colorFlow) ||
            this.flowRotate != CONF.ROAD_COMMON_ROTATE[schemeSemi.direction])
        {
            this.flowRotate = CONF.ROAD_COMMON_ROTATE[schemeSemi.direction];
            this.cell.changeTexture(TT[TYPE_TO_VAR[schemeSemi.type] + 'Flow' + COLOR_TO_VAR[this.colorToIx(schemeSemi.colorFlow)] + (this.flowRotate ? 'Turn' : '')]);
        }
        this.tFlow = this.colorToIx(schemeSemi.colorFlow);
    }

    private showSprite(spriteType: SpriteType, schemeSemi: SchemeSemi) : void {
        if (!this[spriteType]) {
            this[spriteType] = new SpriteModel(TT[TYPE_TO_VAR[schemeSemi.type] + spriteType + COLOR_TO_VAR[this.colorToIx(schemeSemi['color' + spriteType])]]);
            this[spriteType].centeredPivot = true;
            this.cell.model.addChild(this[spriteType].model);
            this[spriteType].model.angle = CONF.ROAD_COMMON_ROTATE[schemeSemi.direction];
        }
        else if (this.semiconductorDrawn != schemeSemi.type ||
            this['t' + spriteType] != this.colorToIx(schemeSemi['color' + spriteType]))
        {
            this[spriteType].changeTexture(TT[TYPE_TO_VAR[schemeSemi.type] + spriteType + COLOR_TO_VAR[this.colorToIx(schemeSemi['color' + spriteType])]]);
        }
        this['t' + spriteType] = this.colorToIx(schemeSemi['color' + spriteType]);
    }

    private colorToIx(color: SemiColor) : number {
        if (!color) { return 0; }
        return CONF.COLOR_TO_STONE_TYPE[color];
    }
}