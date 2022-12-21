import {AbstractComponent} from "./AbstractComponent";
import {IPoss} from "../IPoss";
import * as CONF from "../../config/game";
import {HH} from "../HH";
import {SIDES} from "../../config/game";
import {DirSide} from "../Types/DirectionSide";
import {CellGen} from "../Types/CellGen";

export class GenComponent extends AbstractComponent {

    private static newCell() : CellGen {
        return {
            current: CONF.COLOR_RED_ROAD,
            start: CONF.COLOR_RED_ROAD,
            phases: [CONF.COLOR_VIOLET_ROAD, CONF.COLOR_INDIGO_ROAD],
        };
    }

    public put(poss: IPoss) : void {
        if (!this.isCellEmpty(poss) || !this.isOnlyRoadsAround(poss)) {
            return;
        }
        this.scheme.getCellForGenForced(poss, GenComponent.newCell())

        this.cancelColorForRoadsAround(poss);
        this.contentCellAdd(poss);

        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    public remove(poss: IPoss) : void {
        let cell = this.scheme.findCellOfGen(poss);
        if (!cell) { return; }

        this.cancelColorForRoadsAround(poss);
        this.contentCellRemove(poss);
        this.scheme.killCell(poss);

        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    public colorItAround(poss: IPoss) : void {
        let cell = this.scheme.findCellOfGen(poss);
        if (!cell) { return; }

        SIDES.forEach((sideTo: DirSide) => {
            this.scheme.setColorToRoad(cell!.gen.current, CONF.OPPOSITE_SIDE[sideTo], HH[sideTo](poss))
        });
    }

    private isOnlyRoadsAround(poss: IPoss) : boolean {
        for (const side of SIDES) {
            if (!this.isCellEmpty(HH[side](poss)) && !this.scheme.findCellOfRoad(HH[side](poss))) { return false; }
        }
        return true;
    }
}