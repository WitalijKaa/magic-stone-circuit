import {AbstractComponent} from "./AbstractComponent";
import {IPoss} from "../IPoss";
import * as CONF from "../../config/game";
import {HH} from "../HH";
import {SIDES} from "../../config/game";
import {DirSide} from "../Types/DirectionSide";
import {CellGen} from "../Types/CellGen";
import {ICellWithGen} from "../Interfaces/ICellWithGen";

const MIN_PAUSE = 550;

export class GenComponent extends AbstractComponent {

    private static newCell() : CellGen {
        return {
            isOn: true,
            lastTime: HH.timestampMicro(),
            current: CONF.COLOR_RED_ROAD,
            start: CONF.COLOR_RED_ROAD,
            phases: [CONF.COLOR_VIOLET_ROAD, CONF.COLOR_INDIGO_ROAD],
        };
    }

    public tapGen(poss: IPoss) : void {
        let cell = this.scheme.findCellOfGen(poss);
        if (!cell) { return; }

        cell.gen.isOn = !cell.gen.isOn;
        cell.gen.current = cell.gen.start;
        cell.gen.lastTime = HH.timestampMicro();
        this.cancelColorForRoadsAround(poss);

        this.refreshVisibleCell(poss);
        this.afterChange();
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

        if (this.switchPhase(cell)) { return; }

        SIDES.forEach((sideTo: DirSide) => {
            this.scheme.setColorToRoad(cell!.gen.current, CONF.OPPOSITE_SIDE[sideTo], HH[sideTo](poss))
        });
    }

    private switchPhase(cell: ICellWithGen) : boolean {
        if (!cell.gen.isOn) { return false; }
        if (HH.mtsDiff(cell.gen.lastTime) < MIN_PAUSE || this.scheme.lastColoringOnUpdateTimeDiff() < MIN_PAUSE) { return false; }

        let ix = cell.gen.phases.indexOf(cell.gen.current);
        if (ix < 0) {
            cell.gen.current = cell.gen.phases[0];
        }
        else {
            ix++;
            if (ix >= cell.gen.phases.length) { ix = 0; }
            cell.gen.current = cell.gen.phases[ix];
        }

        cell.gen.lastTime = HH.timestampMicro();
        this.cancelColorForRoadsAround(cell);
        this.refreshVisibleCell(cell);
        return true;
    }

    private isOnlyRoadsAround(poss: IPoss) : boolean {
        for (const side of SIDES) {
            if (!this.isCellEmpty(HH[side](poss)) && !this.scheme.findCellOfRoad(HH[side](poss))) { return false; }
        }
        return true;
    }
}