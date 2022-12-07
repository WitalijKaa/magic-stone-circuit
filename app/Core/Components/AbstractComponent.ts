import {Scheme} from "../Scheme";
import {IPoss} from "../IPoss";
import {CellScheme} from "../CellScheme";
import {SchemeCopy} from "../Types/Scheme";
import {ColorCellCache} from "../Types/ColorCellCache";
import {DirSide} from "../Types/DirectionSide";
import {ICellWithContent} from "../Interfaces/ICellWithContent";

export abstract class AbstractComponent {

    constructor(protected scheme: Scheme) { }

    protected get isGameBlock() : boolean { return this.scheme.isGameBlock; }
    protected actionAlphaTick() : boolean { return this.scheme.actionAlphaTick(); }
    protected get isSchemeLevelMode() : boolean { return this.scheme.isLevelMode; }
    protected get checkRun() : number { return this.scheme.checkRun; }

    protected get _devCell() : IPoss { return this.scheme._devCell; };

    protected isCellEmpty(poss: IPoss) : boolean { return this.scheme.isCellEmpty(poss); }
    protected findCell(poss: IPoss) : null | CellScheme { return this.scheme.findCell(poss); }
    protected getCell(poss: IPoss) : CellScheme { return this.scheme.getCell(poss); }
    protected possEquals(possA: IPoss, possB: IPoss) : boolean { return this.scheme.possEquals(possA, possB); }
    protected possNotEquals(possA: IPoss, possB: IPoss) : boolean { return !this.scheme.possEquals(possA, possB); }
    
    protected cancelColorForRoadsAround(poss: IPoss) : void { this.scheme.cancelColorFromAnyRoadPathAroundCell(poss); }
    protected cancelColorForRoadAroundBySide(side: DirSide, poss: IPoss) : void { this.scheme.cancelColorFromRoadPathAroundCellBySide(side, poss); }

    protected refreshVisibleAll() : void { this.scheme.visibleGrid.refreshAllCells(); }
    protected refreshVisibleCell(poss: IPoss) : void { this.scheme.refreshVisibleCell(poss); }

    public get isRoadBuildMode() : boolean { return this.scheme.isRoadBuildMode; }

    protected belongsToLine(dot: number, start: number, end: number) : boolean {
        return (end > start && dot >= start && dot <= end) || (end < start && dot <= start && dot >= end);
    }

    protected contentCellAdd(poss: IPoss) : void { this.scheme.setContentCell(poss); }
    protected contentCellRemove(poss: IPoss) : void {
        this.scheme.cacheColorRemove(poss);
        this.scheme.removeContentCell(poss);
    }
    protected cacheColorRemove(poss: IPoss) : void { this.scheme.cacheColorRemove(poss); }
    protected cacheColorToDirRemove(toDir: DirSide, poss: IPoss) : void { this.scheme.cacheColorToDirRemove(toDir, poss); }

    protected afterChange() : void { this.scheme.afterChange(); }

    protected loadScheme(schemeCopy: SchemeCopy, poss: IPoss) : void {
        this.scheme.loadScheme(schemeCopy, poss.x, poss.y);
        this.scheme.afterChange();
    }
}