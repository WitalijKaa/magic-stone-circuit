import {Scheme} from "../Scheme";
import {IPoss} from "../IPoss";
import {DirSide} from "../Types/DirectionSide";
import {OPPOSITE_SIDE, ROAD_PATH_HEAVY, SIDES_TURN_90, SIDES_TURN_BY_CLOCK} from "../../config/game";
import {ContentColor} from "../Types/ColorTypes";
import {CellRoad, CellRoadPathType} from "../Types/CellRoad";
import * as CONF from "../../config/game";
import {AbstractComponent} from "./AbstractComponent";
import {HH} from "../HH";

export class SpeedComponent extends AbstractComponent {

    private currentPutDir: DirSide = 'Right';

    public put(poss: IPoss) {
        let cell = this.scheme.findCellOfSpeed(poss);
        if (cell) {
            cell.speed.to = this.currentPutDir = SIDES_TURN_BY_CLOCK[cell.speed.to];
            cell.speed.color = null;
            this.scheme.refreshVisibleCell(poss);
            this.scheme.afterChange();
            this.cancelColorForRoadsAround(poss); // todo only specific
        }
        else if (this.scheme.createCellForSpeed(poss, this.currentPutDir)) {
            this.scheme.refreshVisibleCell(poss);
            this.scheme.afterChange();
            this.cancelColorForRoadsAround(poss); // todo only specific
        }
    }

    public delete(poss: IPoss) {
        let cell = this.scheme.findCellOfSpeed(poss);
        if (!cell) { return; }

        this.cancelColorForRoadsAround(poss); // todo only specific
        this.contentCellRemove(poss);
        this.scheme.killCell(poss);
        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    public colorIt(color: ContentColor, fromDir: DirSide, poss: IPoss) {
        let cell = this.scheme.findCellOfSpeed(poss);
        if (!cell || color == cell.speed.color || OPPOSITE_SIDE[fromDir] != cell.speed.to) { return; }

        cell.speed.color = color;

        if (color) { this.contentCellAdd(poss); }
        else { this.contentCellRemove(poss); }
        this.cacheColorRemove(poss);

        if (!color) {
            this.scheme.eraseColorOnRoadPathFromSide(null, CONF.OPPOSITE_SIDE[cell.speed.to], HH[cell.speed.to](cell));
        }
        this.refreshVisibleCell(poss);
    }

    public colorItAround(poss: IPoss) {
        let cell = this.scheme.findCellOfSpeed(poss);
        if (!cell || !cell.speed.color) { return; }

        this.setColorToRoadFromSide(null, HH[cell.speed.to](poss), cell.speed.color, CONF.OPPOSITE_SIDE[cell.speed.to]);
        this.scheme.refreshVisibleCell(poss);
    }

    private setColorToRoadFromSide(checkRun: number | null, poss: IPoss, color: null | ContentColor, fromDir: DirSide) {
        let cell = this.scheme.findCellOfRoad(poss);
        if (!cell || !cell.isUncoloredRoadPathFromSide(fromDir)) { return; }

        let nextCheckRun = this.verifyCheckRunForRoadPath(cell, fromDir, checkRun);
        if (!nextCheckRun) { return; }

        let nextSides = this.setColorToPathsOfRoadAndGetNextSides(color, cell.road, fromDir);
        nextSides.forEach((toDir: DirSide) => {
            let nextPosition = HH[toDir](cell!);
            this.setColorToRoadFromSide(checkRun, nextPosition, color, CONF.OPPOSITE_SIDE[toDir]);
            if (!color) {
                this.cacheColorRemove(nextPosition);
                this.scheme.setColorToMagicObjByRoad(color, CONF.OPPOSITE_SIDE[toDir], nextPosition)
            }
        });
        if (color) { this.scheme.transferColorToNextCellsExceptToRoadByCache(cell, nextSides, color); }
        this.scheme.refreshVisibleCell(poss);
    }

    public setColorToPathsOfRoadAndGetNextSides(color: null | ContentColor, road: CellRoad, fromDir: DirSide): Array<DirSide> {
        let sides: Array<DirSide> = [];
        if (road.paths[CONF.SIDE_TO_ROAD_PATH[fromDir]]) {
            this.applyColorToPath(color, road, CONF.SIDE_TO_ROAD_PATH[fromDir], fromDir);

            let oppositePathType = CONF.SIDE_TO_ROAD_PATH[CONF.OPPOSITE_SIDE[fromDir]];
            if (road.paths[oppositePathType]) {
                this.applyColorToPath(color, road, oppositePathType, fromDir);
                sides.push(CONF.OPPOSITE_SIDE[fromDir]);
            }

            if (road.paths[ROAD_PATH_HEAVY] || (!road.paths[oppositePathType])) {
                SIDES_TURN_90[fromDir].forEach((side: DirSide) => {
                    if (road.paths[CONF.SIDE_TO_ROAD_PATH[side]]) {
                        this.applyColorToPath(color, road, CONF.SIDE_TO_ROAD_PATH[side], CONF.OPPOSITE_SIDE[side]);
                        sides.push(side);
                    }
                });
            }

            if (road.paths[ROAD_PATH_HEAVY]) {
                this.applyColorToPath(color, road, ROAD_PATH_HEAVY, fromDir);
            }
        }
        return sides;
    }

    private applyColorToPath(color: null | ContentColor, road: CellRoad, pathType: CellRoadPathType, fromDir: DirSide) : void {
        if (!color) { road.paths[pathType] = true; }
        else { road.paths[pathType] = { from: fromDir, color: color }; }
    }
}