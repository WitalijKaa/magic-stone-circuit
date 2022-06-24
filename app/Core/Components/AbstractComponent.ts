import {Scheme} from "../Scheme";
import {IPoss} from "../IPoss";
import {CellScheme} from "../CellScheme";

export abstract class AbstractComponent {

    constructor(protected scheme: Scheme) { }

    protected get _devCell() : IPoss { return this.scheme._devCell; };

    public findCell(poss: IPoss) : null | CellScheme { return this.scheme.findCell(poss); }
    protected getCell(poss: IPoss) : CellScheme { return this.scheme.getCell(poss); }

    protected refreshVisibleCell(poss: IPoss) : void { this.scheme.refreshVisibleCell(poss); }

    public get isRoadBuildMode() : boolean { return this.scheme.isRoadBuildMode; }
}