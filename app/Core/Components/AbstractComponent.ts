import {Scheme} from "../Scheme";
import {IPoss} from "../IPoss";
import {CellScheme} from "../CellScheme";

export abstract class AbstractComponent {

    constructor(protected scheme: Scheme) { }

    protected get _devCell() : IPoss { return this.scheme._devCell; };

    public findCell(poss: IPoss) : null | CellScheme { return this.scheme.findCell(poss); }
    protected getCell(poss: IPoss) : CellScheme { return this.scheme.getCell(poss); }
    protected possEquals(possA: IPoss, possB: IPoss) : boolean { return this.scheme.possEquals(possA, possB); }
    protected possNotEquals(possA: IPoss, possB: IPoss) : boolean { return !this.scheme.possEquals(possA, possB); }

    protected refreshVisibleAll() : void { this.scheme.visibleGrid.refreshAllCells(); }
    protected refreshVisibleCell(poss: IPoss) : void { this.scheme.refreshVisibleCell(poss); }

    public get isRoadBuildMode() : boolean { return this.scheme.isRoadBuildMode; }

    protected belongsToLine(dot: number, start: number, end: number) : boolean {
        return (end > start && dot >= start && dot <= end) || (end < start && dot <= start && dot >= end);
    }
}