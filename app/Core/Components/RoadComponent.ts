import {AbstractComponent} from "./AbstractComponent";
import {DirSide} from "../Types/DirectionSide";
import {IPoss} from "../IPoss";
import * as CONF from "../../config/game";
import {CellRoad, CellRoadPathType, RoadPathsArray} from "../Types/CellRoad";
import {HH} from "../HH";
import {ICellWithRoad} from "../Interfaces/ICellWithRoad";
import {SIDES} from "../../config/game";

export class RoadComponent extends AbstractComponent {

    /** ERASE mass */

    public eraseColorsAroundByPaths(roadPaths: RoadPathsArray, poss: IPoss) : void {
        SIDES.forEach((side: DirSide) => {
            if (roadPaths[CONF.SIDE_TO_ROAD_PATH[side]]) {
                this.eraseColorOnRoadPathFromSide(null, CONF.OPPOSITE_SIDE[side], HH[side](poss));
            }
        });
    }

    /** ERASE */

    public eraseColorOnRoadPathFromSide(checkRun: number | null, fromDir: DirSide, poss: IPoss) : void {
        let cell = this.scheme.findCellOfRoad(poss);
        if (!cell || !cell.isRoadPathFromSide(fromDir)) { return; }

        let nextCheckRun = this.verifyCheckRunForRoadPath(cell, fromDir, checkRun);
        if (!nextCheckRun) { return; }

        let oppositeDir: DirSide = CONF.OPPOSITE_SIDE[fromDir];
        let oppositePath: CellRoadPathType = CONF.SIDE_TO_ROAD_PATH[oppositeDir];

        cell.road.paths[CONF.SIDE_TO_ROAD_PATH[fromDir]] = true;
        this.makeRoadPathUncolored(cell.road, CONF.ROAD_PATH_HEAVY);

        this.cacheColorToDirRemove(oppositeDir, poss);
        this.cacheColorToDirRemove(fromDir, poss);

        this.eraseColorOnSecondRoadPath(poss, cell.road, oppositeDir, nextCheckRun);

        if (!cell.road.paths[oppositePath] || cell.road.paths[CONF.ROAD_PATH_HEAVY]) {
            CONF.SIDES_TURN_90[fromDir].forEach((turnDir: DirSide) => {
                this.eraseColorOnSecondRoadPath(poss, cell!.road, turnDir, nextCheckRun as number);
            })
        }
        this.refreshVisibleCell(poss);
    }

    private eraseColorOnSecondRoadPath(poss: IPoss, road: CellRoad, toDir: DirSide, nextCheckRun: number) : void {
        let pathType = CONF.SIDE_TO_ROAD_PATH[toDir];
        if (!road.paths[pathType]) { return; }

        let fromDir: DirSide = CONF.OPPOSITE_SIDE[toDir];
        let nextCellPoss: IPoss = HH[toDir](poss);

        road.paths[pathType] = true;
        this.scheme.eraseSpeedColorByRoad(fromDir, nextCellPoss);
        this.scheme.eraseSemiconductorColorByRoad(fromDir, nextCellPoss);
        this.scheme.eraseSmileColorByRoad(fromDir, nextCellPoss);

        this.eraseColorOnRoadPathFromSide(nextCheckRun, fromDir, nextCellPoss);

        this.cacheColorToDirRemove(toDir, poss);
        this.cacheColorToDirRemove(fromDir, poss);
    }

    private makeRoadPathUncolored(road: CellRoad, pathType: CellRoadPathType) {
        if (road.paths[pathType]) { road.paths[pathType] = true; }
    }
}