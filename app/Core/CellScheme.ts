import * as CONF from "../config/game";
import {SIDES, UP, RIGHT, DOWN, LEFT, SIDES_UP_DOWN} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {ROAD_PATH_UP, ROAD_PATH_RIGHT, ROAD_PATH_DOWN, ROAD_PATH_LEFT, ROAD_PATH_HEAVY} from "../config/game"
import {Cell} from "./Cell";
import {SchemeBase} from "./SchemeBase";
import {CellRoad} from "./Types/CellRoad";
import {CellStone, CellStoneType} from "./Types/CellStone";
import {ICellScheme} from "./Interfaces/ICellScheme";
import {CellSemiconductor, CellSemiconductorType} from "./Types/CellSemiconductor";
import {HH} from "./HH";
import {DirSide} from "./Types/DirectionSide";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {IPoss} from "./IPoss";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {CellSmile} from "./Types/CellSmile";
import {CellTrigger} from "./Types/CellTrigger";
import {CellSpeed} from "./Types/CellSpeed";
import {CellSwitcher} from "./Types/CellSwitcher";
import {CellGen} from "./Types/CellGen";

export class CellScheme implements ICellScheme {

    cellPosition: Cell;
    scheme: SchemeBase;

    content: CellStone | null = null;
    road: CellRoad | null = null;
    semiconductor: CellSemiconductor | null = null;
    trigger: CellTrigger | null = null;
    speed: CellSpeed | null = null;
    switcher: CellSwitcher | null = null;
    gen: CellGen | null = null;
    smile: CellSmile | null = null;

    constructor(x: number, y: number, scheme: SchemeBase) {
        this.cellPosition = new Cell(x, y);
        this.scheme = scheme;
    }

    public get poss() : IPoss { return { x: this.x, y: this.y }; }

    public isAtPosition(poss: IPoss) : boolean {
        return this.cellPosition.isAtPosition(poss);
    }

    get stone() : CellStoneType | null {
        if (this.content && HH.isStone(this.content.type)) {
            return this.content.type;
        }
        return null;
    }

    get x() : number { return this.cellPosition.x; }
    get y() : number { return this.cellPosition.y; }

    get isAwakeSemiconductor() : boolean {
        return !!(this.semiconductor && CONF.ST_ROAD_AWAKE == this.semiconductor.type);
    }
    get isSleepSemiconductor() : boolean {
        return !!(this.semiconductor && CONF.ST_ROAD_SLEEP == this.semiconductor.type);
    }

    get isAllSidesPathsExist() : boolean {
        return 4 === this.countSidePathsOnly;
    }

    isCellConnectedAtSide(side: DirSide) : boolean {
        const sideCell : CellScheme | null = this[side];
        if (!sideCell) { return false; }

        if (sideCell.road) {
            return this.isRoadSideCellConnected(sideCell as ICellWithRoad, side);
        }
        if (sideCell.semiconductor) {
            return HH.isSemiconductorCanBeConnectedToSide(sideCell as ICellWithSemiconductor, side);
        }
        return true;
    }

    isCellConnectedToUncoloredRoadAtSide(side: DirSide) : boolean {
        const sideCell : CellScheme | null = this[side];
        if (!sideCell || !sideCell.road) { return false; }

        return true === sideCell.road.paths[CONF.SIDE_TO_ROAD_PATH[CONF.OPPOSITE_SIDE[side]]];
    }

    public isRoadSideCellConnected(sideCell: ICellWithRoad, sideOfSideCell: DirSide) : boolean {
        switch (sideOfSideCell) {
            case UP: return this.isRoadConnectedToUp(sideCell as ICellWithRoad);
            case RIGHT: return this.isRoadConnectedToRight(sideCell as ICellWithRoad);
            case DOWN: return this.isRoadConnectedToDown(sideCell as ICellWithRoad);
            case LEFT: return this.isRoadConnectedToLeft(sideCell as ICellWithRoad);
        }
        return false;
    }

    isCellConnectedButNotRoadAtSide(side: DirSide, sideCell : CellScheme | null = null) : boolean {
        if (!sideCell) { sideCell = this[side.toLocaleLowerCase()]; }
        if (!sideCell || sideCell.road) { return false; }

        if (sideCell.semiconductor) {
            return HH.isSemiconductorCanBeConnectedToSide(sideCell as ICellWithSemiconductor, side);
        }
        return true;
    }

    private isRoadConnectedToUp(sideCell: ICellWithRoad) : boolean {
        return !!(ROAD_UP_DOWN == sideCell.road.type || ROAD_HEAVY == sideCell.road.type || sideCell.road.paths[CONF.ROAD_PATH_DOWN]);
    }
    private isRoadConnectedToDown(sideCell: ICellWithRoad) : boolean {
        return !!(ROAD_UP_DOWN == sideCell.road.type || ROAD_HEAVY == sideCell.road.type || sideCell.road.paths[CONF.ROAD_PATH_UP]);
    }
    private isRoadConnectedToLeft(sideCell: ICellWithRoad) : boolean {
        return !!(ROAD_LEFT_RIGHT == sideCell.road.type || ROAD_HEAVY == sideCell.road.type || sideCell.road.paths[CONF.ROAD_PATH_RIGHT]);
    }
    private isRoadConnectedToRight(sideCell: ICellWithRoad) : boolean {
        return !!(ROAD_LEFT_RIGHT == sideCell.road.type || ROAD_HEAVY == sideCell.road.type || sideCell.road.paths[CONF.ROAD_PATH_LEFT]);
    }

    public isRoadPathFromSide(side: DirSide) : boolean {
        return !!this.road!.paths[CONF.SIDE_TO_ROAD_PATH[side]];
    }

    public isColoredRoadPathFromSide(side: DirSide) : boolean {
        return this.road!.paths[CONF.SIDE_TO_ROAD_PATH[side]] && true !== this.road!.paths[CONF.SIDE_TO_ROAD_PATH[side]];
    }

    public isUncoloredRoadPathFromSide(side: DirSide) : boolean {
        return true === this.road!.paths[CONF.SIDE_TO_ROAD_PATH[side]];
    }

    public isColoredRoadPathAtSideFlowToThatSide(side: DirSide) : boolean {
        if (!this.isColoredRoadPathFromSide(side)) { return false; }
        return !!this.getColorOfPath(this.road!, side, CONF.OPPOSITE_SIDE[side]);
    }

    public isColoredRoadPathAtSideFlowFromThatSide(side: DirSide) : boolean {
        if (!this.isColoredRoadPathFromSide(side)) { return false; }
        return !!this.getColorOfPath(this.road!, side, side);
    }

    public getColorOfPath(road: CellRoad, sideOfPath: DirSide, flowFromDir: DirSide) : number | null {
        let path = road.paths[CONF.SIDE_TO_ROAD_PATH[sideOfPath]]
        if ('boolean' != typeof path && path.from == flowFromDir) {
            return path.color;
        }
        return null;
    }
    
    public colorOfConnectedColoredRoadAtSideThatFlowsHere(side: DirSide) : number | null {
        let sideCell = this.scheme.findCellOfRoad(this.cellPosition[side]);
        if (!sideCell) { return null; }
        return this.getColorOfPath(sideCell.road, CONF.OPPOSITE_SIDE[side], side);
    }
    public colorOfConnectedColoredRoadAtSideThatFlowsOutHere(side: DirSide) : number | null {
        let sideCell = this.scheme.findCellOfRoad(this.cellPosition[side]);
        if (!sideCell) { return null; }
        return this.getColorOfPath(sideCell.road, CONF.OPPOSITE_SIDE[side], CONF.OPPOSITE_SIDE[side]);
    }

    public get sidesOfSemiconductor() : Array<DirSide> {
        if (!this.semiconductor) { return []; }
        if (CONF.ST_ROAD_SLEEP == this.semiconductor.type) {
            return this.semiconductor.direction == ROAD_LEFT_RIGHT ? [LEFT, RIGHT] : [UP, DOWN];
        }
        return SIDES;
    }

    public isAwakeSemiconductorConnectedToAnyOtherSemiconductorAtSide(side: DirSide) : boolean {
        if (!this.isAwakeSemiconductor) { return false; }
        let sideCell = this.scheme.findCellOfSemiconductor(this.cellPosition[side]);
        if (!sideCell) { return false; }
        return HH.isSemiconductorCanBeConnectedToSide(sideCell, side);
    }

    public get isSpeedToUpOrDown() : boolean {
        return !!this.speed && SIDES_UP_DOWN.includes(this.speed.to)
    }
    public get isSpeedToLeftOrRight() : boolean {
        return !!this.speed && !this.isSpeedToUpOrDown;
    }

    public get countSidePathsOnly () : number {
        if (!this.road) { return 0; }
        let count = 0;
        for (let ix = 0; ix < 4; ix++) {
            if (this.road.paths[ix]) {
                count++;
            }
        }
        return count;
    }

    get up() : CellScheme | null { return this.scheme.findCell(this.cellPosition.Up); }
    get right() : CellScheme | null { return this.scheme.findCell(this.cellPosition.Right); }
    get down() : CellScheme | null { return this.scheme.findCell(this.cellPosition.Down); }
    get left() : CellScheme | null { return this.scheme.findCell(this.cellPosition.Left); }

    get Up() : CellScheme | null { return this.scheme.findCell(this.cellPosition.Up); }
    get Right() : CellScheme | null { return this.scheme.findCell(this.cellPosition.Right); }
    get Down() : CellScheme | null { return this.scheme.findCell(this.cellPosition.Down); }
    get Left() : CellScheme | null { return this.scheme.findCell(this.cellPosition.Left); }
}