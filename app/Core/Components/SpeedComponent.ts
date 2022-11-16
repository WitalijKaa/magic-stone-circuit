import {Scheme} from "../Scheme";
import {IPoss} from "../IPoss";
import {DirSide} from "../Types/DirectionSide";
import {SIDES_TURN_BY_CLOCK} from "../../config/game";

export class SpeedComponent {

    private currentPutDir: DirSide = 'Right';

    constructor(private scheme: Scheme) { }

    public put(poss: IPoss) {
        let cell = this.scheme.findCellOfSpeed(poss);
        if (cell) {
            cell.speed.to = this.currentPutDir = SIDES_TURN_BY_CLOCK[cell.speed.to];
            this.scheme.refreshVisibleCell(poss);
            this.scheme.afterChange();
            this.scheme.cancelColorPathsForAnyRoadAround(poss);
        }
        else if (this.scheme.createCellForSpeed(poss, this.currentPutDir)) {
            this.scheme.refreshVisibleCell(poss);
            this.scheme.afterChange();
            this.scheme.setContentCell(poss);
            this.scheme.cancelColorPathsForAnyRoadAround(poss);
        }
    }

    public delete(poss: IPoss) {
        let cell = this.scheme.findCellOfSpeed(poss);
        if (!cell) { return; }

        this.scheme.cancelColorPathsForAnyRoadAround(poss);
        this.scheme.removeContentCell(poss);
        this.scheme.killCell(poss);
        this.scheme.refreshVisibleCell(poss);
        this.scheme.afterChange();
    }
}