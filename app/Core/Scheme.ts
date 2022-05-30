import * as CONF from "../config/game"
import {SchemeBase} from "./SchemeBase";
import {IPoss} from "./IPoss";

export class Scheme extends SchemeBase {

    visibleUpdate(poss: IPoss) {
        this.visibleGrid.refreshVisibleCell(poss);
    }
    afterChange() {}

    /** STONEs **/

    putContent(type: CONF.ST_STONES, poss: IPoss) : void {
        let cell = this.getCellForContent(poss);
        if (!cell) { return; }
        let oldType = cell.content;
        //if (oldType != type) { this.cancelNeighborsColorPathForAnyRoadByPaths(CONF.ALL_PATHS_ARE, x, y); }
        cell.content = type;
        this.contentCells[this.cellName(poss)] = poss;
        this.visibleUpdate(poss);
        //this.updatePathsOnNeighborsRoads(x, y);
        //if (oldType != type) { this.cancelNeighborsColorPathForAnyRoadByPaths(CONF.ALL_PATHS_ARE, x, y); }

        CONF.SIDES.map((sideTo) => {
            //this.setAwakeColorSemiconductorByStone(STONE_TYPE_TO_ROAD_COLOR[type], ...this[sideTo](x, y))
        });

        if (this.coloringAwaitTick) {
            // this.coloringCellCache(x, y).push({
            //     type: CONF.ST_STONE_VIOLET,
            //     method: 'setColorAroundByStone',
            //     params: [x, y],
            //     cacheDirections: CONF.SIDES,
            // });
        }

        this.afterChange();
    }

    removeContent(poss: IPoss) {
        let cell = this.findCellOfContent(poss);
        if (!cell) { return; }
        //this.cancelNeighborsColorPathForAnyRoadByPaths(CONF.ALL_PATHS_ARE, x, y);
        CONF.SIDES.map((sideTo) => {
            //this.setAwakeColorSemiconductorByStone(null, ...this[sideTo](x, y))
        });
        delete(this.contentCells[this.cellName(poss)]);
        this.killCell(poss);
        //this.updatePathsOnNeighborsRoads(x, y);

        this.afterChange();
    }

    setColorAroundByStone(poss: IPoss) {
        let cell = this.findCellOfContent(poss);
        if (!cell) { return; }

        CONF.SIDES.map((sideTo) => {
            //this.setColorToRoad(CONF.STONE_TYPE_TO_ROAD_COLOR[cell.content], CONF.OPPOSITE_SIDE[sideTo], ...this[sideTo](x, y))
        });
    }

}