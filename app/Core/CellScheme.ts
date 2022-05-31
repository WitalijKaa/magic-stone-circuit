import * as CONF from "../config/game";
import {UP, RIGHT, DOWN, LEFT} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {Cell} from "./Cell";
import {SchemeBase} from "./SchemeBase";
import {CellRoad} from "./Types/CellRoad";
import {CellStone} from "./Types/CellStone";
import {ICellScheme} from "./Interfaces/ICellScheme";
import {CellSemiconductor} from "./Types/CellSemiconductor";

export class CellScheme implements ICellScheme {

    cellPosition: Cell;
    scheme: SchemeBase;

    content: CellStone | null = null;
    road: CellRoad | null = null;
    semiconductor: CellSemiconductor | null = null;

    constructor(x: number, y: number, scheme: SchemeBase) {
        this.cellPosition = new Cell(x, y);
        this.scheme = scheme;
    }

    get stone() : CellStone | null {
        if (this.content && CONF.STONES.includes(this.content)) {
            return this.content;
        }
        return null;
    }

    get x() : number { return this.cellPosition.x; }
    get y() : number { return this.cellPosition.y; }

    get isEmptyAround() : boolean {
        return !this.up && !this.right && !this.down && !this.left;
    }
    
    get isSidesPathsAllExist() : boolean {
        if (this.road) {
            return !!(this.road.paths[0] && this.road.paths[1] && this.road.paths[2] && this.road.paths[3]);
        }
        return false;
    }

    isCellConnectedAtSide(side: string) : boolean {
        if (this.road) {
            switch (side) {
                case UP: return this.isRoadConnectedToUp;
                case RIGHT: return this.isRoadConnectedToRight;
                case DOWN: return this.isRoadConnectedToDown;
                case LEFT: return this.isRoadConnectedToLeft;
            }
            return false;
        }
        return this.isCellConnectedButNotRoadAtSide(side);
    }

    isCellConnectedButNotRoadAtSide(side: string) : boolean {
        if (this.road) { return false; }
        if (this.semiconductor && ROAD_HEAVY != this.semiconductor.direction) {
            if (LEFT == side || RIGHT == side) {
                if (this.semiconductor.direction != ROAD_LEFT_RIGHT) { return false; }
            }
            else {
                if (this.semiconductor.direction != ROAD_UP_DOWN) { return false; }
            }
        }
        return true;
    }

    get isRoadConnectedToUp() : boolean {
        if (this.road) {
            return !!(ROAD_UP_DOWN == this.road.type || ROAD_HEAVY == this.road.type || this.road.paths[CONF.ROAD_PATH_UP]);
        }
        return false;
    }
    get isRoadConnectedToDown() : boolean {
        if (this.road) {
            return !!(ROAD_UP_DOWN == this.road.type || ROAD_HEAVY == this.road.type || this.road.paths[CONF.ROAD_PATH_DOWN]);
        }
        return false;
    }
    get isRoadConnectedToLeft() : boolean {
        if (this.road) {
            return !!(ROAD_LEFT_RIGHT == this.road.type || ROAD_HEAVY == this.road.type || this.road.paths[CONF.ROAD_PATH_LEFT]);
        }
        return false;
    }
    get isRoadConnectedToRight() : boolean {
        if (this.road) {
            return !!(ROAD_LEFT_RIGHT == this.road.type || ROAD_HEAVY == this.road.type || this.road.paths[CONF.ROAD_PATH_RIGHT]);
        }
        return false;
    }

    get up() : CellScheme | null { return this.scheme.findCell(this.cellPosition.up); }
    get right() : CellScheme | null { return this.scheme.findCell(this.cellPosition.right); }
    get down() : CellScheme | null { return this.scheme.findCell(this.cellPosition.down); }
    get left() : CellScheme | null { return this.scheme.findCell(this.cellPosition.left); }
}