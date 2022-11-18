import * as CONF from "../../config/game";
import {CellGrid} from "./CellGrid";
import {CellSemiconductor as SchemeSemi, CellSemiconductorType} from "../../Core/Types/CellSemiconductor";
import {TT} from "../../config/textures";
import {ST_ROAD_AWAKE, ST_ROAD_SLEEP} from "../../config/game";
import {SpriteModel} from "../SpriteModel";
import {ContentColor} from "../../Core/Types/ColorTypes";
import {ICellWithSemiconductor} from "../../Core/Interfaces/ICellWithSemiconductor";
import {CellGhost} from "./CellGhost";

type SpriteType = 'Awake' | 'Charge' | 'Flow';

const TYPE_TO_VAR = {
    [ST_ROAD_SLEEP]: 'sleep',
    [ST_ROAD_AWAKE]: 'semi',
} as const;

const COLOR_TO_VAR = ['', 'V', 'R', 'I', 'O'];

const ADDITIONAL_SPRITES = ['Awake', 'Charge'];

export class CellSemiconductor {

    private ghost: null | ICellWithSemiconductor = null;

    private semiconductorDrawn: CellSemiconductorType | null = null;
    private Awake!: SpriteModel;
    private Charge!: SpriteModel;

    private flowRotate: number = 0;
    private tFlow: number = 0;
    private tAwake: number = 0;
    private tCharge: number = 0;

    constructor(private cell: CellGrid | CellGhost) { }

    public update() : void {
        let semi = this.schemeCell;
        if (semi) {
            this.showFlow(semi);
            for (let spriteType of ADDITIONAL_SPRITES) {
                this.showSprite(spriteType as SpriteType, semi);
            }
            this.semiconductorDrawn = semi.type;
        }
        else if (this.semiconductorDrawn) {
            this.destroySemiconductor();
            this.semiconductorDrawn = null;
        }
    }

    private destroySemiconductor() : void {
        for (let spriteType of ADDITIONAL_SPRITES) {
            if (this[spriteType]) {
                this[spriteType].destroy();
            }
            this[spriteType] = null;
        }
        if (this.isEmptyHere) {
            this.cell.changeTexture(this.cell.defaultTexture);
        }
    }

    private showFlow(schemeSemi: SchemeSemi) : void {
        if (!this.semiconductorDrawn ||
            this.semiconductorDrawn != schemeSemi.type ||
            this.tFlow != this.colorToVarConstIx(schemeSemi.colorFlow) ||
            this.flowRotate != CONF.ROAD_COMMON_ROTATE[schemeSemi.direction])
        {
            this.flowRotate = CONF.ROAD_COMMON_ROTATE[schemeSemi.direction];
            this.cell.changeTexture(TT[TYPE_TO_VAR[schemeSemi.type] + 'Flow' + COLOR_TO_VAR[this.colorToVarConstIx(schemeSemi.colorFlow)] + (this.flowRotate ? 'Turn' : '')]);
        }
        this.tFlow = this.colorToVarConstIx(schemeSemi.colorFlow);
    }

    private showSprite(spriteType: SpriteType, schemeSemi: SchemeSemi) : void {
        if (!this[spriteType]) {
            this[spriteType] = new SpriteModel(TT[TYPE_TO_VAR[schemeSemi.type] + spriteType + COLOR_TO_VAR[this.colorToVarConstIx(schemeSemi['color' + spriteType])]]);
            this[spriteType].centeredPivot = true;
            this.cell.model.addChild(this[spriteType].model);
        }
        else if (this.semiconductorDrawn != schemeSemi.type ||
            this['t' + spriteType] != this.colorToVarConstIx(schemeSemi['color' + spriteType]))
        {
            this[spriteType].changeTexture(TT[TYPE_TO_VAR[schemeSemi.type] + spriteType + COLOR_TO_VAR[this.colorToVarConstIx(schemeSemi['color' + spriteType])]]);
        }
        this[spriteType].model.angle = CONF.ROAD_COMMON_ROTATE[schemeSemi.direction];
        this['t' + spriteType] = this.colorToVarConstIx(schemeSemi['color' + spriteType]);
    }

    private colorToVarConstIx(color: ContentColor) : number {
        if (!color) { return 0; }
        return CONF.COLOR_TO_STONE_TYPE[color];
    }

    private get isEmptyHere() : boolean {
        if (!this.ghost) { return !this.cell.schemeCell?.content; }
        return true;
    }

    private get schemeCell() : null | SchemeSemi {
        if (!this.ghost) { return this.cell.schemeCell ? this.cell.schemeCell.semiconductor : null; }
        return this.ghost.semiconductor;
    }

    public set asGhost(cell: ICellWithSemiconductor) { this.ghost = cell; }

    public killGhost() : void { this.destroySemiconductor(); }
}