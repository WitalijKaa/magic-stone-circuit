import {AbstractComponent} from "./AbstractComponent";
import {IPoss} from "../IPoss";
import * as CONF from "../../config/game";
import {CellStoneType} from "../Types/CellStone";
import {CellSwitcher} from "../Types/CellSwitcher";
import {HH} from "../HH";
import {LEFT, RIGHT, SIDES} from "../../config/game";

export class SwitcherComponent extends AbstractComponent {

    private static newCell(stoneType: CellStoneType, range: Array<CellStoneType>) : CellSwitcher {
        return { type: stoneType, range: range };
    }

    public tap(poss: IPoss) : void {
        let cell = this.scheme.findCellOfSwitcher(poss);
        if (!cell) { return; }

        let ix = cell.switcher.range.indexOf(cell.switcher.type);
        if (ix == -1) { return; }

        this.cancelColorForRoadsAround(poss);
        cell.switcher.type = cell.switcher.range[(ix == cell.switcher.range.length - 1) ? 0 : ix + 1];
        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    public put(stoneType: CellStoneType, range: Array<CellStoneType>, poss: IPoss) : boolean {
        return false;
    }

    public remove(poss: IPoss) : boolean {
        return false;
    }

    public colorItAround(poss: IPoss) : void {
        let cell = this.scheme.findCellOfSwitcher(poss);
        if (!cell) { return; }

        this.scheme.setColorToRoad(CONF.STONE_TYPE_TO_ROAD_COLOR[cell.switcher.type], LEFT, HH[RIGHT](poss))
        this.refreshVisibleCell(poss);
        this.afterChange();
    }
}
