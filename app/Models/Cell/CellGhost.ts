import {Sprite} from '@pixi/sprite';
import {CellGrid} from "./CellGrid";
import {SchemeFormatConverter} from "../../Core/SchemeFormatConverter";
import {SchemeCellStructure} from "../../Core/Types/Scheme";
import {CellStone} from "./CellStone";
import {CellRoad} from "./CellRoad";
import {CellSemiconductor} from "./CellSemiconductor";
import {CellTrigger} from "./CellTrigger";
import {CellSpeed} from "./CellSpeed";
import {SpriteModel} from "../SpriteModel";
import {TT} from "../../config/textures";
import {ICellWithStone} from "../../Core/Interfaces/ICellWithStone";
import {ICellWithRoad} from "../../Core/Interfaces/ICellWithRoad";
import {ICellWithSemiconductor} from "../../Core/Interfaces/ICellWithSemiconductor";
import {ICellWithTrigger} from "../../Core/Interfaces/ICellWithTrigger";
import {ICellWithSpeed} from "../../Core/Interfaces/ICellWithSpeed";
import {CellGen} from "./CellGen";
import {ICellWithGen} from "../../Core/Interfaces/ICellWithGen";

export class CellGhost extends SpriteModel {

    private ghost: null | CellStone | CellRoad | CellSemiconductor | CellTrigger | CellSpeed | CellGen = null;

    constructor(private cell: CellGrid) { super(); }

    public update() : void {
        let ghost = this.cell.scheme.findGhost(this.cell.schemePosition);
        let ghostCell: null | SchemeCellStructure = null;
        if (ghost) { ghostCell = SchemeFormatConverter.toGhostFormat(this.cell.schemePosition, ghost); }

        if (ghostCell) {
            this.init();
            if (this.ghost) { this.ghost.killGhost(); this.ghost = null; }

            if ('content' in ghostCell && ghostCell.content) {
                this.ghost = new CellStone(this);
            }
            else if ('road' in ghostCell && ghostCell.road) {
                this.ghost = new CellRoad(this);
            }
            else if ('semiconductor' in ghostCell && ghostCell.semiconductor) {
                this.ghost = new CellSemiconductor(this);
            }
            else if ('trigger' in ghostCell && ghostCell.trigger) {
                this.ghost = new CellTrigger(this);
            }
            else if ('speed' in ghostCell && ghostCell.speed) {
                this.ghost = new CellSpeed(this);
            }
            else if ('gen' in ghostCell && ghostCell.gen) {
                this.ghost = new CellGen(this);
            }

            if (this.ghost) {
                this.ghost.asGhost = ghostCell as ICellWithStone | ICellWithRoad | ICellWithSemiconductor | ICellWithTrigger | ICellWithSpeed | ICellWithGen;
                this.ghost.update();
                this.cell.model.addChild(this.model);
            }
        }
        else if (this.ghost) {
            this.ghost.killGhost();
            this.ghost = null;
            this.cell.model.removeChild(this.model);
        }
    }

    public get defaultTexture () : string { return TT.ghost; }

    public get schemeCell() : null { return null; }

    private doneInit: boolean = false;
    private init() : void {
        if (this.doneInit) { return; }
        this.model = Sprite.from(this.defaultTexture)
        this.model.alpha = 0.8;
        this.doneInit = true;
    }
}