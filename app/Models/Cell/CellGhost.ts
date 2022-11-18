import {CellGrid} from "./CellGrid";
import {SchemeFormatConverter} from "../../Core/SchemeFormatConverter";
import {SchemeCellStructure} from "../../Core/Types/Scheme";
import {CellContent} from "./CellContent";
import {CellRoad} from "./CellRoad";
import {CellSemiconductor} from "./CellSemiconductor";
import {CellTrigger} from "./CellTrigger";
import {CellSpeed} from "./CellSpeed";
import {SpriteModel} from "../SpriteModel";
import {TT} from "../../config/textures";
import {CellAbstract} from "./CellAbstract";
import {ICellWithContent} from "../../Core/Interfaces/ICellWithContent";
import {ICellWithRoad} from "../../Core/Interfaces/ICellWithRoad";
import {ICellWithSemiconductor} from "../../Core/Interfaces/ICellWithSemiconductor";
import {ICellWithTrigger} from "../../Core/Interfaces/ICellWithTrigger";
import {ICellWithSpeed} from "../../Core/Interfaces/ICellWithSpeed";

export class CellGhost extends CellAbstract {

    constructor(private cell: CellGrid) {
        super(cell.visiblePosition, cell.visibleGrid, SpriteModel.from(TT.ghost));
    }

    private ghost: null | CellContent | CellRoad | CellSemiconductor | CellTrigger | CellSpeed = null;

    public update() : void {
        let ghost = this.cell.scheme.findGhost(this.cell.schemePosition);
        let ghostCell: null | SchemeCellStructure = null;
        if (ghost) { ghostCell = SchemeFormatConverter.toGhostFormat(this.cell.schemePosition, ghost); }

        if (ghostCell) {
            if (this.ghost) { this.ghost.killGhost(); this.ghost = null; }

            if ('content' in ghostCell && ghostCell.content) {
                this.ghost = new CellContent(this);
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

            if (this.ghost) {
                this.ghost.asGhost = ghostCell as ICellWithContent | ICellWithRoad | ICellWithSemiconductor | ICellWithTrigger | ICellWithSpeed;
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
}