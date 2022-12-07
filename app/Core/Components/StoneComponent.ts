import {AbstractComponent} from "./AbstractComponent";
import {IPoss} from "../IPoss";
import * as CONF from "../../config/game";
import {CellStone, CellStoneType} from "../Types/CellStone";
import {HH} from "../HH";
import {SIDES} from "../../config/game";
import {DirSide} from "../Types/DirectionSide";

export class StoneComponent extends AbstractComponent {

    private static newCell(stoneType: CellStoneType) : CellStone {
        return { type: stoneType };
    }

    public put(stoneType: CellStoneType, poss: IPoss) : boolean {
        let prevStone = this.scheme.findCellOfStone(poss);
        if (prevStone) {
            this.remove(poss);
        }

        let cell = this.scheme.getCellForStone(poss);
        if (!cell) { return false; }
        cell.content = StoneComponent.newCell(stoneType);
        this.contentCellAdd(poss);

        if (!prevStone) {
            this.cancelColorForRoadsAround(poss);
        }

        this.refreshVisibleCell(poss);
        this.afterChange();
        return true;
    }

    public remove(poss: IPoss) : boolean {
        let cell = this.scheme.findCellOfStone(poss);
        if (!cell) { return false; }

        this.cancelColorForRoadsAround(poss);
        this.contentCellRemove(poss);
        this.scheme.killCell(poss);

        this.refreshVisibleCell(poss);
        this.afterChange();
        return true;
    }

    public colorItAround(poss: IPoss) : void {
        let cell = this.scheme.findCellOfStone(poss);
        if (!cell) { return; }

        SIDES.map((sideTo: DirSide) => {
            this.scheme.setColorToRoad(CONF.STONE_TYPE_TO_ROAD_COLOR[cell!.content.type], CONF.OPPOSITE_SIDE[sideTo], HH[sideTo](poss))
        });
    }
}