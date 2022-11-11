import {Scheme} from "../Scheme";
import {IPoss} from "../IPoss";

export class TriggerStrategy {

    constructor(private scheme: Scheme) { }

    public put(poss: IPoss) {
        if (this.scheme.createCellForTrigger(poss)) {
            this.scheme.refreshVisibleCell(poss);
            this.scheme.afterChange();
        }
    }

}