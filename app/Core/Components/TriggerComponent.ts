import {IPoss} from "../IPoss";
import {DirSide} from "../Types/DirectionSide";
import {ContentColor} from "../Types/ColorTypes";
import { SIDES, LEFT, RIGHT, UP, DOWN } from "../../config/game";
import {HH} from "../HH";
import {AbstractComponent} from "./AbstractComponent";

export class TriggerComponent extends AbstractComponent {

    public put(poss: IPoss) {
        if (this.scheme.createCellForTrigger(poss)) {
            this.cancelColorForRoadAroundBySide(LEFT, poss);
            this.cancelColorForRoadAroundBySide(RIGHT, poss);
            this.afterChange();
            this.refreshVisibleCell(poss);
        }
    }

    public delete(poss: IPoss) {
        let cell = this.scheme.findCellOfTrigger(poss);
        if (!cell) { return; }

        this.cancelColorForRoadAroundBySide(RIGHT, poss);
        this.contentCellRemove(poss);
        this.scheme.killCell(poss);
        this.afterChange();
        this.refreshVisibleCell(poss);
    }

    public colorIt(color: ContentColor, fromDir: DirSide, poss: IPoss) {
        if (!color || LEFT != fromDir) { return; }
        let cell = this.scheme.findCellOfTrigger(poss);
        if (!cell) { return; }

        if (cell.trigger.color != color) {
            this.cancelColorForRoadAroundBySide(RIGHT, poss);
            this.scheme.cacheColorRemove(poss);
        }

        this.contentCellAdd(poss);
        cell.trigger.color = color;
        this.refreshVisibleCell(poss);
    }

    public colorItAround(poss: IPoss) {
        let cell = this.scheme.findCellOfTrigger(poss);
        if (!cell || !cell.trigger.color) { return; }

        this.scheme.setColorToRoad(cell.trigger.color, LEFT, HH[RIGHT](poss))
    }
}