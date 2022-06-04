import * as CONF from "../config/game";

export class HH {

    public static isStone(val: number) : boolean {
        return [CONF.ST_STONE_VIOLET, CONF.ST_STONE_RED, CONF.ST_STONE_INDIGO, CONF.ST_STONE_ORANGE].includes(val);
    }
}