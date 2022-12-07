import {AbstractComponent} from "./AbstractComponent";
import {IPoss} from "../IPoss";
import {CellSemiconductorDirection, CellSemiconductorType} from "../Types/CellSemiconductor";
import {ICellWithSemiconductor} from "../Interfaces/ICellWithSemiconductor";
import {CellSemiconductor} from "../Types/CellSemiconductor";
import {
    LEFT,
    RIGHT,
    ROAD_HEAVY,
    ROAD_LEFT_RIGHT,
    ROAD_UP_DOWN,
    SIDES,
    ST_ROAD_AWAKE,
    ST_ROAD_SLEEP
} from "../../config/game";
import * as CONF from "../../config/game";
import {HH} from "../HH";
import {ContentColor} from "../Types/ColorTypes";
import {DirSide} from "../Types/DirectionSide";
import {CellScheme} from "../CellScheme";

export class SemiconductorComponent extends AbstractComponent {

    private maxAwakeNeighbours: number = 2;

    private static newCell(scType: CellSemiconductorType, direction: CellSemiconductorDirection) : CellSemiconductor {
        return {
            direction: direction,
            type: scType,
            colorAwake: null,
            colorFlow: null,
            colorCharge: null,
            from: null,
            checkRun: 0
        };
    }

    public put(scType: CellSemiconductorType, poss: IPoss) : void {
        let cell: null | ICellWithSemiconductor = this.scheme.getCellForSemiconductor(poss);
        if (!cell) { return; }

        if (CONF.ST_ROAD_SLEEP == scType) {
            this.putSleep(cell, poss);
        }
        else { this.putAwake(cell, poss); }

        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    public remove(poss: IPoss) : void {
        let cell = this.scheme.findCellOfSemiconductor(poss);
        if (!cell) { return; }

        this.contentCellRemove(poss);
        this.scheme.killCell(poss);

        this.removeColorsFromTransistor(poss);

        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    public update(poss: IPoss) : void {
        let emptyMode = this.isCellEmpty(poss);
        if (!emptyMode && !this.scheme.findCellOfStone(poss)) { return; }

        SIDES.map((side: DirSide) => {
            let sideCell = this.scheme.findCellOfSemiconductor(HH[side](poss));
            if (!sideCell?.isAwakeSemiconductor) { return; }

            if (!emptyMode && !sideCell.semiconductor.colorAwake) {
                this.setColorToNewSemiconductor(sideCell);
                if (sideCell.semiconductor.colorAwake) {
                    SIDES.map((side: DirSide) => {
                        let sideCell = this.scheme.findCellOfSemiconductor(HH[side](poss));
                    });
                }
            }
            else if (emptyMode && sideCell.semiconductor.colorAwake && !this.hasTransistorTheAwakeSources(sideCell)) {
                sideCell.semiconductor.colorAwake = null;
                sideCell.semiconductor.colorCharge = null;
                sideCell.semiconductor.colorFlow = null;
                this.removeColorsFromTransistor(sideCell.poss);
            }
        })
    }

    private putSleep(cell: ICellWithSemiconductor, poss: IPoss) {
        if (this.isSemiconductorChargedAround(poss) || this.isSemiconductorSleepAround(poss)) { return; }

        if (cell.isSleepSemiconductor) {
            cell.semiconductor.direction = this.findDirectionToPutSemiconductorSleep(cell, poss);
        }
        else {
            cell.semiconductor = SemiconductorComponent.newCell(ST_ROAD_SLEEP, this.findDirectionToPutSemiconductorSleep(cell, poss))
        }

        this.setColorToNewSemiconductor(cell);
        this.contentCellAdd(poss);

        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    private putAwake(cell: ICellWithSemiconductor, poss: IPoss) : void {
        if (cell.isAwakeSemiconductor) {
            this.turnSleepSemiconductorHere(cell, poss);
            return;
        }
        if (this.isSemiconductorAwakeAroundDiagonal(poss) ||
            this.isSemiconductorChargedAround(poss) ||
            this.isDifferentAwakeColorsAround(poss)) {
            return;
        }

        let clusterFree = this.maxAwakeNeighbours - 1;
        SIDES.map((side) => {
            clusterFree -= this.countAwakeClusterAtSide(poss, null, side);
        })
        if (clusterFree >= 0) {
            cell.semiconductor = SemiconductorComponent.newCell(ST_ROAD_AWAKE, ROAD_HEAVY);
            this.setColorToNewSemiconductor(cell);
            this.turnSleepSemiconductorHere(cell, poss);
        }
    }

    private removeColorsFromTransistor(poss: IPoss) {
        SIDES.map((side: DirSide) => {
            let sideCell = this.scheme.findCellOfSemiconductor(HH[side](poss));
            if (!sideCell) { return; }

            if (sideCell.semiconductor.colorAwake && sideCell.isAwakeSemiconductor && !this.hasTransistorTheAwakeSources(sideCell)) {
                this.setAwakeColorToSemiconductor(sideCell, null, true);
                this.removeChargeColorFromSemiconductor(sideCell);
            }
            else if (sideCell.semiconductor.colorCharge && sideCell.isAwakeSemiconductor && !this.hasTransistorTheChargeSources(sideCell)) {
                this.removeChargeColorFromSemiconductor(sideCell);
            }
            else if (sideCell.isSleepSemiconductor) {
                this.setAwakeColorToSemiconductor(sideCell, null, false);
                this.setChargeColorToSemiconductor(sideCell, null);
            }

            this.refreshVisibleCell(HH[side](poss));
        });
    }

    private findDirectionToPutSemiconductorSleep(cell: ICellWithSemiconductor, poss: IPoss) : CellSemiconductorDirection {
        let direction: CellSemiconductorDirection = ROAD_LEFT_RIGHT;
        if (this.isSemiconductorAwakeAround(poss)) {
            if (!this.isSemiconductorAwakeAtLeftOrAtRight(poss)) { direction = ROAD_UP_DOWN; }
        }
        else if (cell.isSleepSemiconductor) {
            direction = (ROAD_LEFT_RIGHT == cell.semiconductor.direction ? ROAD_UP_DOWN : ROAD_LEFT_RIGHT);
        }
        else if (this.scheme.isAnyRoadAround(poss) && !this.scheme.isAnyRoadLeftOrRight(poss)) {
            direction = ROAD_UP_DOWN;
        }
        return direction;
    }

    private isSemiconductorChargedAround(poss: IPoss) : boolean {
        for (let side of SIDES) {
            let cell = this.scheme.findCellOfSemiconductor(HH[side](poss));
            if (cell && cell.semiconductor.colorCharge) {
                return true;
            }
        }
        return false;
    }

    private isSemiconductorAwakeAroundDiagonal(poss: IPoss) : boolean { return this.isSemiconductorTypeAround(poss, CONF.ST_ROAD_AWAKE, CONF.SIDES_DIAGONAL); }
    private isSemiconductorSleepAround(poss: IPoss) : boolean { return this.isSemiconductorTypeAround(poss, CONF.ST_ROAD_SLEEP); }
    private isSemiconductorAwakeAround(poss: IPoss) : boolean { return this.isSemiconductorTypeAround(poss, CONF.ST_ROAD_AWAKE); }
    private isSemiconductorAwakeAtLeftOrAtRight(poss: IPoss) : boolean {
        return this.isSemiconductorTypeAround(poss, CONF.ST_ROAD_AWAKE, [LEFT, RIGHT]);
    }

    private isSemiconductorTypeAround(poss: IPoss, scType: CellSemiconductorType, sides: Array<string> = SIDES) : boolean {
        for (let side of sides) {
            let cell = this.scheme.findCellOfSemiconductor(HH[side](poss));
            if (cell && cell.semiconductor.type == scType) {
                return true;
            }
        }
        return false;
    }

    private isDifferentAwakeColorsAround(poss: IPoss, color: null | false | ContentColor = null) : boolean {
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

    private colorForAwakeAtSide(poss: IPoss) : ContentColor | null {
        let cell = this.findCell(poss);
        if (!cell) { return null; }

        if (cell.content) {
            return CONF.STONE_TYPE_TO_ROAD_COLOR[cell.content.type];
        }
        if (cell.semiconductor && cell.semiconductor.colorAwake) {
            return cell.semiconductor.colorAwake;
        }
        return null;
    }

    private countAwakeClusterAtSide(poss: IPoss, checkRun: number | null, side: DirSide) : number {
        let sideCell = this.scheme.findCellOfSemiconductor(HH[side](poss));
        if (!sideCell || CONF.ST_ROAD_AWAKE != sideCell.semiconductor.type) { return 0; }

        if (!checkRun) { checkRun = this.checkRun; }
        if (sideCell.semiconductor.checkRun == checkRun) { return 0; }
        sideCell.semiconductor.checkRun = checkRun;

        let count = 1;
        SIDES.map((toDir: DirSide) => {
            if (toDir == CONF.OPPOSITE_SIDE[side]) { return; }
            count += this.countAwakeClusterAtSide(HH[side](poss), checkRun, toDir)
        })
        return count;
    }

    private setColorToNewSemiconductor(cell: ICellWithSemiconductor) : void {
        SIDES.map((side: DirSide) => {
            let cellSide: CellScheme | null = this.findCell(HH[side](cell.poss));
            if (!cellSide) { return; }

            if (cellSide.content) {
                this.setAwakeColorToSemiconductor(cell, CONF.STONE_TYPE_TO_ROAD_COLOR[cellSide!.content!.type], true);
            }

            if (!cell.semiconductor.colorAwake && cellSide.isAwakeSemiconductor && cellSide.semiconductor!.colorAwake) {
                this.setAwakeColorToSemiconductor(cell, cellSide.semiconductor!.colorAwake);
            }
        });

        this.setChargeColorToNewSemiconductor(cell);
        SIDES.map((side: DirSide) => {
            let cellSide: ICellWithSemiconductor | null = this.scheme.findCellOfSemiconductor(HH[side](cell.poss));
            if (!cellSide) { return; }
            this.setChargeColorToNewSemiconductor(cellSide);
        });
    }

    private setChargeColorToNewSemiconductor(cell: ICellWithSemiconductor) {
        if (cell.isAwakeSemiconductor && cell.semiconductor.colorAwake) {
            SIDES.map((side: DirSide) => {
                if (cell.semiconductor.colorCharge) { return; }
                let color = cell.colorOfConnectedColoredRoadAtSideThatFlowsHere(side);
                if (color && color == cell.semiconductor.colorAwake) {
                    this.setChargeColorToSemiconductor(cell);
                }
            });
        }
    }

    private setAwakeColorToSemiconductor(cell: ICellWithSemiconductor, color: ContentColor, onlyForAwakeType: boolean = false, checkRun: number | null = null) : void {
        if ((!cell.isAwakeSemiconductor && onlyForAwakeType) || cell.semiconductor.colorAwake == color) {
            return;
        }
        // if (cell.isAwakeSemiconductor && !color && (this.countStonesAround(poss) || this.hasAwakeSemiNeighborsAnyStoneAround(poss))) {
        //     return; // helps to remove stone and do not reset semi
        // }
        let semi = cell.semiconductor;

        semi.colorAwake = color;
        if (!color || semi.colorCharge != semi.colorAwake) {
            if (semi.colorFlow) {
                cell.sidesOfSemiconductor.map((side: DirSide) => {
                    this.cancelColorForRoadAroundBySide(side, cell.poss);
                });
            }
            semi.colorCharge = null;
            semi.colorFlow = null;
        }
        this.cacheColorRemove(cell.poss);

        this.refreshVisibleCell(cell.poss);

        if (!checkRun) { checkRun = semi.checkRun = this.checkRun; }
        else if (checkRun == semi.checkRun) { return; }
        semi.checkRun = checkRun;

        if (cell.isAwakeSemiconductor) {
            SIDES.map((side: DirSide) => {
                let cellSideSemi = this.scheme.findCellOfSemiconductor(HH[side](cell.poss));
                if (!cellSideSemi) { return; }
                this.setAwakeColorToSemiconductor(cellSideSemi, color, false, checkRun);
            });
        }
    }

    private setChargeColorToSemiconductor(cell: ICellWithSemiconductor, checkRun: number | null = null, removeMode: boolean = false) : void {
        let semi = cell.semiconductor;
        semi.colorCharge = removeMode ? null : semi.colorAwake;
        this.cacheColorRemove(cell.poss);

        this.refreshVisibleCell(cell.poss);

        if (!checkRun) { checkRun = this.checkRun; }
        else if (checkRun == semi.checkRun) { return; }
        semi.checkRun = checkRun;

        SIDES.map((side: DirSide) => {
            let cellSideSemi = this.scheme.findCellOfSemiconductor(HH[side](cell.poss));
            if (!cellSideSemi) { return; }
            this.setChargeColorToSemiconductor(cellSideSemi, checkRun, removeMode);
        });
    }

    private removeChargeColorFromSemiconductor(cell: ICellWithSemiconductor) : void {
        this.setChargeColorToSemiconductor(cell, null, true);
    }

    private turnSleepSemiconductorHere(cell: ICellWithSemiconductor, poss: IPoss) : void {
        if (!cell.isAwakeSemiconductor) { return; }

        SIDES.map((side) => {
            let sideCell = this.scheme.findCellOfSemiconductor(HH[side](poss));
            if (!sideCell?.isSleepSemiconductor) { return; }
            let changed = false;

            if (LEFT == side || RIGHT == side) {
                if (sideCell.semiconductor.direction != ROAD_LEFT_RIGHT) {
                    sideCell.semiconductor.direction = ROAD_LEFT_RIGHT;
                    changed = true;
                }
            }
            else {
                if (sideCell.semiconductor.direction != ROAD_UP_DOWN) {
                    sideCell.semiconductor.direction = ROAD_UP_DOWN;
                    changed = true;
                }
            }

            if (changed) {
                this.cancelColorForRoadsAround(HH[side](poss));
                this.setColorToNewSemiconductor(cell);
                this.refreshVisibleCell(HH[side](poss));
            }
        })
    }

    private hasTransistorTheAwakeSources(cell: ICellWithSemiconductor) : boolean {
        for (let side of SIDES) {
            if (this.scheme.findCellOfStone(HH[side](cell))) {
                return true; // works only for transistor with 2 awake semiconductors
            }
        }
        return false;
    }

    private hasTransistorTheChargeSources(cell: ICellWithSemiconductor) : boolean {
        for (let side of SIDES) {
            let color = cell.colorOfConnectedColoredRoadAtSideThatFlowsHere(side);
            if (color && cell.semiconductor.colorCharge == color) {
                return true; // works only for transistor with 2 awake semiconductors
            }
        }
        return false;
    }
}