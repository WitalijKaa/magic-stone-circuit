import * as CONF from "../config/game";
import {IPoss} from "./IPoss";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {DirSide} from "./Types/DirectionSide";
import {LEFT, RIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game";

export class HH {

    public static isStone(val: number) : boolean { return [CONF.ST_STONE_VIOLET, CONF.ST_STONE_RED, CONF.ST_STONE_INDIGO, CONF.ST_STONE_ORANGE].includes(val); }
    public static isRoad(val: number) : boolean { return CONF.ST_ROAD == val; }
    public static isSemiconductor(val: number) : boolean { return [CONF.ST_ROAD_SLEEP, CONF.ST_ROAD_AWAKE].includes(val); }
    public static isTrigger(val: number) : boolean { return CONF.ST_TRIGGER == val; }
    public static isSpeed(val: number) : boolean { return CONF.ST_SPEED == val; }
    public static isGen(val: number) : boolean { return CONF.ST_GEN == val; }

    public static rnd(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    public static ucfirst(str: string) : string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    public static timestamp() : number {
        return Math.floor(Date.now() / 1000);
    }
    public static timestampMicro() : number {
        return Date.now();
    }
    public static mtsDiff(prevMoment: number) : number {
        return Date.now() - prevMoment;
    }

    public static Up(poss: IPoss) : IPoss { return { x: poss.x, y: poss.y - 1 }; }
    public static Right(poss: IPoss) : IPoss { return { x: poss.x + 1, y: poss.y }; }
    public static Down(poss: IPoss) : IPoss { return { x: poss.x, y: poss.y + 1 }; }
    public static Left(poss: IPoss) : IPoss { return { x: poss.x - 1, y: poss.y }; }
    public static UpLeft(poss: IPoss) : IPoss { return { x: poss.x - 1, y: poss.y - 1 }; }
    public static UpRight(poss: IPoss) : IPoss { return { x: poss.x + 1, y: poss.y - 1 }; }
    public static DownLeft(poss: IPoss) : IPoss { return { x: poss.x - 1, y: poss.y + 1 }; }
    public static DownRight(poss: IPoss) : IPoss { return { x: poss.x + 1, y: poss.y + 1 }; }

    public static clonePoss(poss: IPoss) : IPoss {
        return { x: poss.x, y: poss.y };
    }

    public static isSemiconductorCanBeConnectedToSide(semiCell: ICellWithSemiconductor, side: DirSide) : boolean {
        if (ROAD_HEAVY != semiCell.semiconductor.direction) {
            if (LEFT == side || RIGHT == side) {
                if (semiCell.semiconductor.direction != ROAD_LEFT_RIGHT) { return false; }
            }
            else {
                if (semiCell.semiconductor.direction != ROAD_UP_DOWN) { return false; }
            }
        }
        return true;
    }

    public static cellName (poss: IPoss) : string { return poss.x + '|' + poss.y; }
}