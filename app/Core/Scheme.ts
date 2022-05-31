import * as CONF from "../config/game"
import {UP, RIGHT, DOWN, LEFT} from "../config/game"
import {ROAD_LIGHT, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN} from "../config/game"
import {SchemeBase} from "./SchemeBase";
import {IPoss} from "./IPoss";
import {CellStone} from "./Types/CellStone";
import {CellRoadType, RoadChangeHistory} from "./Types/CellRoad";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";

export class Scheme extends SchemeBase {

    visibleUpdate(poss: IPoss) {
        this.visibleGrid.refreshVisibleCell(poss);
    }
    afterChange() {}

    /** STONEs **/

    putContent(type: CellStone, poss: IPoss) : void {
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
        // todo remove

        this.afterChange();
    }

    setColorAroundByStone(poss: IPoss) {
        let cell = this.findCellOfContent(poss);
        if (!cell) { return; }

        CONF.SIDES.map((sideTo) => {
            //this.setColorToRoad(CONF.STONE_TYPE_TO_ROAD_COLOR[cell.content], CONF.OPPOSITE_SIDE[sideTo], ...this[sideTo](x, y))
        });
    }

    /** ROADs **/

    tapRoad(poss: IPoss) {
        if (this.isRoadBuildMode) { return; }

        if (false === this.setPathsOnRoadByTap(poss)) {
            this.removeRoad(poss);
        }
        this.removeColoringCellCache(poss);
        this.afterChange();
    }

    putRoadHorizontal(poss: IPoss) {
        let preferType = ROAD_LEFT_RIGHT;
        let cell = this.getCellForRoad(poss);
        if (cell) {
            let mergedZones = this.mergeZones([LEFT, RIGHT], poss);
            if (ROAD_HEAVY == cell.road.type || mergedZones.length == 3) {
                preferType = ROAD_HEAVY;
            }
        }

        return this.setPathsOnRoad(false, LEFT, RIGHT, preferType, poss);
    }

    putRoadZonal(zoneFrom, zoneTo, poss: IPoss) {
        let preferType = ROAD_LIGHT;
        let cell = this.getCellForRoad(poss);
        if (cell) {
            let mergedZones = this.mergeZones([zoneFrom, zoneTo], poss);
            if (ROAD_HEAVY == cell.road.type || mergedZones.length > 2) {
                preferType = ROAD_HEAVY;
            }
        }

        return this.setPathsOnRoad(false, zoneFrom, zoneTo, preferType, poss);
    }

    putRoadVertical(poss: IPoss) {
        let preferType = ROAD_UP_DOWN;
        let cell = this.getCellForRoad(poss);
        if (cell) {
            let mergedZones = this.mergeZones([UP, DOWN], poss);
            if (ROAD_HEAVY == cell.road.type || mergedZones.length == 3) {
                preferType = ROAD_HEAVY;
            }
        }

        return this.setPathsOnRoad(false, UP, DOWN, preferType, poss);
    }

    afterPutRoad(poss: IPoss) {
        this.removeColoringCellCache(poss);
        //this.cancelNeighborsColorPathForAnyRoadByPaths(this.findCellOrEmpty(poss).road.paths, poss);
    }

    removeRoad(poss: IPoss) {
        if (!this.findCellOfRoad(poss)) { return; }

        //this.cancelNeighborsColorPathForAnyRoadByPaths(CONF.ALL_PATHS_ARE, poss);

        //this.changeCellRoad(null, poss);
        this.removeColoringCellCache(poss);
        this.visibleUpdate(poss);
        this.afterChange();
    }

    /** PATHs of road **/

    setPathsOnRoadByArr(updatePathsMode: boolean, replaceZonesMode: boolean, zones: Array<string>, preferType: CellRoadType | null, poss: IPoss) : RoadChangeHistory {
        let change: RoadChangeHistory = { prev: null, curr: null };
        if (zones.length < 2 && replaceZonesMode) { return change; }

        let wasCellEmpty = this.isCellEmpty(poss);
        let cell = this.getCellForRoad(poss);
        if (!cell) { return change; }

        let mergedZones = (replaceZonesMode || wasCellEmpty) ? [...zones] : this.mergeZones(zones, poss);

        if (!preferType ||
            (ROAD_LEFT_RIGHT == preferType && (!zones.includes(LEFT) || !zones.includes(RIGHT))) ||
            (ROAD_UP_DOWN == preferType && (!zones.includes(UP) || !zones.includes(DOWN))) ||
            (ROAD_HEAVY == preferType && 2 >= mergedZones.length))
        {
            preferType = ROAD_LIGHT;
        }

        if (mergedZones.length == 3) { preferType = ROAD_HEAVY; }
        if (ROAD_HEAVY != preferType && mergedZones.length == 4) { preferType = ROAD_LIGHT; }

        if (wasCellEmpty) {
            change = { prev: null, curr: preferType };
            cell.road.type = preferType;
        }
        else {
            if (cell.road.type == preferType && this.arePathsTheSame(cell.road.paths, this.zonesToRoadPaths(mergedZones, preferType == ROAD_HEAVY))) {
                return change;
            }
            change = { prev: cell.road.type, prevPaths: [...cell.road.paths.map((path) => { return !!path; })], curr: preferType };
        }

        cell.road.type = preferType;
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_LEFT, mergedZones.includes(LEFT), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_RIGHT, mergedZones.includes(RIGHT), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_UP, mergedZones.includes(UP), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_DOWN, mergedZones.includes(DOWN), updatePathsMode);
        this.defineRoadPath(cell, poss, CONF.ROAD_PATH_HEAVY, ROAD_HEAVY == preferType, updatePathsMode);
        this.visibleUpdate(poss);
        //this._devCell = [poss];this.devCellEcho();
        return change;
    }

    setPathsOnRoad(updateMode, zoneFrom, zoneTo, preferType, poss: IPoss) {
        if (zoneFrom == CONF.OVER_CENTER || zoneTo == CONF.OVER_CENTER) { return { prev: null, curr: null }; }
        return this.setPathsOnRoadByArr(updateMode, false, [zoneFrom, zoneTo], preferType, poss);
    }
    setPathOnRoad(updateMode, zone, poss: IPoss) {
        if (zone == CONF.OVER_CENTER) { return { prev: null, curr: null }; }
        return this.setPathsOnRoadByArr(updateMode, false, [zone], ROAD_LIGHT, poss);
    }

    setPathsOnRoadByTap(poss: IPoss) : null | false | RoadChangeHistory {
        let wasCellEmpty = this.isCellEmpty(poss);
        let cell = this.getCellForRoad(poss);
        if (!cell) { return null; }

        if (cell.isEmptyAround) {
            if (!cell.road.paths[CONF.ROAD_PATH_UP] && cell.road.paths[CONF.ROAD_PATH_RIGHT] && !cell.road.paths[CONF.ROAD_PATH_DOWN] && cell.road.paths[CONF.ROAD_PATH_LEFT]) {
                return this.setPathsOnRoadByArr(false, true, [UP, DOWN], ROAD_LIGHT, poss);
            }
            return false;
        }

        if (ROAD_LIGHT == cell.road.type && cell.isSidesPathsAllExist) {
            return this.setPathsOnRoadByArr(false, false, [], ROAD_HEAVY, poss);
        }

        if (wasCellEmpty) {
            let sides: Array<string> = [];
            if (cell.isCellConnectedAtSide(UP)) { sides.push(UP); }
            if (cell.isCellConnectedAtSide(RIGHT)) { sides.push(RIGHT); }
            if (cell.isCellConnectedAtSide(DOWN)) { sides.push(DOWN); }
            if (cell.isCellConnectedAtSide(LEFT)) { sides.push(LEFT); }

            if (sides.length > 1) {
                return this.setPathsOnRoadByArr(false, true, sides, null, poss);
            }
            else if (sides.length == 1 && (sides[0] == UP || sides[0] == DOWN)) {
                return this.setPathsOnRoadByArr(false, true, [UP, DOWN], ROAD_LIGHT, poss);
            }
            else { return this.setPathsOnRoadByArr(false, true, [LEFT, RIGHT], ROAD_LIGHT, poss); }
        }
        return false;
    }

    updatePathsOnNeighborsRoads(poss: IPoss) {
        CONF.SIDES.map((toDir) => {
            // this.visibleUpdate(...this[toDir](poss));
        });
    }

    defineRoadPath(cell: ICellWithRoad, poss: IPoss, pathType: number, pathContent: boolean, updateMode: boolean = false) {
        if (!updateMode || !pathContent) {
            cell.road.paths[pathType] = pathContent;
            //this.cancelColorOnDefineRoadPath(poss, pathType);
        }
        else if (!cell.road.paths[pathType]) {
            cell.road.paths[pathType] = pathContent;
            //this.cancelColorOnDefineRoadPath(poss, pathType);
        }
    }

}