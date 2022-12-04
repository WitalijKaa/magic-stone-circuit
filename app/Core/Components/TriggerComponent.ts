import {Scheme} from "../Scheme";
import {IPoss} from "../IPoss";
import {DirSide} from "../Types/DirectionSide";
import {ContentColor} from "../Types/ColorTypes";
import * as CONF from "../../config/game";
import {HH} from "../HH";

export class TriggerComponent {

    constructor(private scheme: Scheme) { }

    public put(poss: IPoss) {
        if (this.scheme.createCellForTrigger(poss)) {
            this.scheme.refreshVisibleCell(poss);
            this.scheme.afterChange();
            this.scheme.setContentCell(poss);
            this.scheme.cancelColorFromRoadPathAroundCellBySide(CONF.LEFT, poss);
            this.scheme.cancelColorFromRoadPathAroundCellBySide(CONF.RIGHT, poss);
        }
    }

    public delete(poss: IPoss) {
        let cell = this.scheme.findCellOfTrigger(poss);
        if (!cell) { return; }

        this.scheme.cancelColorFromRoadPathAroundCellBySide(CONF.RIGHT, poss);
        this.scheme.cacheColorRemove(poss);
        this.scheme.removeContentCell(poss);
        this.scheme.killCell(poss);
        this.scheme.refreshVisibleCell(poss);
        this.scheme.afterChange();
    }

    public colorIt(color: ContentColor, fromDir: DirSide, poss: IPoss) {
        if (CONF.LEFT != fromDir) { return; }
        let cell = this.scheme.findCellOfTrigger(poss);
        if (!cell) { return; }

        if (cell.trigger.color != color) {
            this.scheme.cancelColorFromRoadPathAroundCellBySide(CONF.RIGHT, poss);
            this.scheme.cacheColorRemove(poss);
        }
        
        cell.trigger.color = color;
        this.scheme.refreshVisibleCell(poss);
    }

    public colorItAround(poss: IPoss) {
        let cell = this.scheme.findCellOfTrigger(poss);
        if (!cell) { return; }

        if (cell.trigger.color) {
            this.scheme.setColorToRoad(cell.trigger.color, CONF.LEFT, HH[CONF.RIGHT](poss))
        }
    }
}