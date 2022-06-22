import * as CONF from "../../config/game";
import {AbstractComponent} from "./AbstractComponent";
import {SemiColor} from "../Types/CellSemiconductor";
import {DirSide} from "../Types/DirectionSide";
import {IPoss} from "../IPoss";
import {DOWN, LEFT} from "../../config/game";

export class SmileComponent extends AbstractComponent {

    public putSmile() : void {
        let cell = this.getCell(this._devCell);
        cell.smile = { type: CONF.ST_SMILE_IN, color: null, view: false, logic: 'Violet' };
        this.getCell(cell.cellPosition.Up).smile = { type: CONF.ST_SMILE, color: null, view: false, logic: 'True' };
        this.getCell(cell.cellPosition.Right).smile = { type: CONF.ST_SMILE, color: null, view: true, logic: 'True' };
        this.getCell(cell.cellPosition.Up.Right).smile = { type: CONF.ST_SMILE, color: null, view: false, logic: 'True' };

        this.refreshVisibleCell(cell.cellPosition.Right);
    }

    public setColorToSmileByRoad(color: SemiColor, fromDir: DirSide, poss: IPoss) : void {
        if (![LEFT, DOWN].includes(fromDir)) { return; }
        let cell = this.findCell(poss);
        if (!cell || !cell.smile || CONF.ST_SMILE_IN != cell.smile.type) { return; }

        if (!this['logic' + cell.smile.logic](color)) { color = null; }

        cell.Right!.smile!.color = color;
        this.refreshVisibleCell(cell.cellPosition.Right);
    }

    private logicTrue() : boolean {
        return true;
    }

    private logicViolet(color: SemiColor) : boolean {
        return color == CONF.COLOR_VIOLET_ROAD;
    }
}