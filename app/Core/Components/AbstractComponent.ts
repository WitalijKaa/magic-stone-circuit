import {Scheme} from "../Scheme";
import {IPoss} from "../IPoss";
import {CellScheme} from "../CellScheme";
import {SchemeCopy} from "../Types/Scheme";
import {ColorCellCache} from "../Types/ColorCellCache";
import {DirSide} from "../Types/DirectionSide";
import {ContentColor} from "../Types/ColorTypes";
import {SIDES} from "../../config/game";
import * as CONF from "../../config/game";
import {HH} from "../HH";
import {ICellWithRoad} from "../Interfaces/ICellWithRoad";

export abstract class AbstractComponent {

    constructor(protected scheme: Scheme) { }

    protected actionAlphaTick() : boolean { return this.scheme.actionAlphaTick(); }
    protected get isSchemeLevelMode() : boolean { return this.scheme.isLevelMode; }
    protected get checkRun() : number { return this.scheme.checkRun; }

    protected get _devCell() : IPoss { return this.scheme._devCell; };

    protected isCellEmpty(poss: IPoss) : boolean { return this.scheme.isCellEmpty(poss); }
    protected findCell(poss: IPoss) : null | CellScheme { return this.scheme.findCell(poss); }
    protected getCell(poss: IPoss) : CellScheme { return this.scheme.getCell(poss); }
    protected possEquals(possA: IPoss, possB: IPoss) : boolean { return this.scheme.possEquals(possA, possB); }
    protected possNotEquals(possA: IPoss, possB: IPoss) : boolean { return !this.scheme.possEquals(possA, possB); }

    public verifyCheckRunForRoadPath(cell: ICellWithRoad, fromDir: DirSide, checkRun: number | null) : number | false {
        return this.scheme.verifyCheckRunForRoadPath(cell, fromDir, checkRun);
    }
    
    protected cancelColorForRoadsAround(poss: IPoss) : void {
        SIDES.forEach((side: DirSide) => {
            this.cancelColorForRoadAroundBySide(side, poss);
        });
    }
    protected cancelColorForRoadAroundBySide(side: DirSide, poss: IPoss) : void {
        this.scheme.eraseColorOnRoadPathFromSide(null, CONF.OPPOSITE_SIDE[side], HH[side](poss));
    }

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
    protected cacheColorAdd(poss: IPoss, cache: ColorCellCache) : void { this.scheme.cacheColorAdd(poss, cache); }
    protected cacheColorRemove(poss: IPoss) : void { this.scheme.cacheColorRemove(poss); }
    protected cacheColorToDirRemove(toDir: DirSide, poss: IPoss) : void { this.scheme.cacheColorToDirRemove(toDir, poss); }

    protected afterChange() : void { this.scheme.afterChange(); }

    protected loadScheme(schemeCopy: SchemeCopy, poss: IPoss) : void {
        this.scheme.loadScheme(schemeCopy, poss.x, poss.y);
        this.scheme.afterChange();
    }

    protected colorForAwakeAtSide(poss: IPoss) : ContentColor | null { return null; }
    protected isDifferentAwakeColorsAround(poss: IPoss, color: null | false | ContentColor = null) : boolean {
        SIDES.forEach((side: DirSide) => {
            let sideColor = this.colorForAwakeAtSide(HH[side](poss));
            if (!sideColor) { return; }

            if (null === color) {
                color = sideColor;
            }
            if (color != sideColor) {
                color = false;
            }
        });
        return false === color;
    }
}