import {AbstractComponent} from "./AbstractComponent";
import {IPoss} from "../IPoss";
import {CellSemiconductorDirection, CellSemiconductorType} from "../Types/CellSemiconductor";
import {ICellWithSemiconductor} from "../Interfaces/ICellWithSemiconductor";
import {CellSemiconductor} from "../Types/CellSemiconductor";
import { LEFT, RIGHT, UP, DOWN, ROAD_HEAVY, ROAD_LEFT_RIGHT, ROAD_UP_DOWN, SIDES, ST_ROAD_AWAKE, ST_ROAD_SLEEP } from "../../config/game";
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

        if (cell.isAwakeSemiconductor) {
            this.removeColorsFromTransistor(poss);
        }

        this.refreshVisibleCell(poss);
        this.afterChange();
    }

    public update(poss: IPoss) : void {
        let emptyMode = this.isCellEmpty(poss);
        if (!emptyMode && !this.scheme.findCellOfStone(poss)) { return; }

        SIDES.forEach((side: DirSide) => {
            let sideCell = this.scheme.findCellOfSemiconductor(HH[side](poss));
            if (!sideCell?.isAwakeSemiconductor) { return; }

            if (!emptyMode && !sideCell.semiconductor.colorAwake) {
                this.setColorToNewSemiconductor(sideCell);
            }
            else if (emptyMode && sideCell.isAwakeSemiconductor && sideCell.semiconductor.colorAwake && !this.hasSemiAwakeClusterTheAwakeSources(sideCell)) {
                this.removeColorsFromTransistor(poss);
            }
        })
    }

    public colorItByRoad(color: ContentColor, fromDir: DirSide, poss: IPoss) : void {
        let cell = this.scheme.findCellOfSemiconductor(poss);
        if (!cell) { return; }
        if (cell.isAwakeSemiconductor) {
            if (!color && this.hasSemiAwakeClusterTheChargeSources(cell)) { return; }
            this.setChargeColorToSemiconductorByRoad(color, fromDir, cell);
        }
        else if (cell.isSleepSemiconductor) {
            if (cell.semiconductor.direction == ROAD_LEFT_RIGHT) {
                if (LEFT != fromDir && RIGHT != fromDir) { return; }
            }
            else if (UP != fromDir && DOWN != fromDir) { return; }

            this.setFlowColorToSemiconductorByRoad(color, fromDir, cell);
        }
    }

    public colorItBySemiconductor(color: number, fromDir: DirSide, poss: IPoss) {
        let cell = this.scheme.findCellOfSemiconductor(poss);
        if (!cell) { return; }
        this.setFlowColorToSemiconductor(color, fromDir, cell);
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
        SIDES.forEach((side) => {
            clusterFree -= this.countAwakeClusterAtSide(poss, null, side);
        })
        if (clusterFree >= 0) {
            cell.semiconductor = SemiconductorComponent.newCell(ST_ROAD_AWAKE, ROAD_HEAVY);
            this.setColorToNewSemiconductor(cell);
            this.turnSleepSemiconductorHere(cell, poss);
        }
    }

    private removeColorsFromTransistor(poss: IPoss) {
        SIDES.forEach((side: DirSide) => {
            let sideCell = this.scheme.findCellOfSemiconductor(HH[side](poss));
            if (!sideCell) { return; }

            if (sideCell.semiconductor.colorAwake && sideCell.isAwakeSemiconductor && !this.hasSemiCellTheAwakeSources(sideCell)) {
                this.setAwakeColorToSemiconductor(sideCell, null, true);
                this.removeChargeColorFromSemiconductor(sideCell);
            }
            else if (sideCell.semiconductor.colorCharge && sideCell.isAwakeSemiconductor && !this.hasSemiCellTheChargeSources(sideCell)) {
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

    protected colorForAwakeAtSide(poss: IPoss) : ContentColor | null {
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
        SIDES.forEach((toDir: DirSide) => {
            if (toDir == CONF.OPPOSITE_SIDE[side]) { return; }
            count += this.countAwakeClusterAtSide(HH[side](poss), checkRun, toDir)
        })
        return count;
    }

    private setColorToNewSemiconductor(cell: ICellWithSemiconductor) : void {
        SIDES.forEach((side: DirSide) => {
            let cellSide: CellScheme | null = this.findCell(HH[side](cell));
            if (!cellSide) { return; }

            if (cellSide.content) {
                this.setAwakeColorToSemiconductor(cell, CONF.STONE_TYPE_TO_ROAD_COLOR[cellSide!.content!.type], true);
            }

            if (!cell.semiconductor.colorAwake && cellSide.isAwakeSemiconductor && cellSide.semiconductor!.colorAwake) {
                this.setAwakeColorToSemiconductor(cell, cellSide.semiconductor!.colorAwake);
            }
        });

        this.setChargeColorToNewSemiconductor(cell);
        SIDES.forEach((side: DirSide) => {
            let cellSide: ICellWithSemiconductor | null = this.scheme.findCellOfSemiconductor(HH[side](cell));
            if (!cellSide) { return; }
            this.setChargeColorToNewSemiconductor(cellSide);
        });
    }

    private setChargeColorToNewSemiconductor(cell: ICellWithSemiconductor) {
        if (cell.isAwakeSemiconductor && cell.semiconductor.colorAwake) {
            SIDES.forEach((side: DirSide) => {
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
                cell.sidesOfSemiconductor.forEach((side: DirSide) => {
                    this.cancelColorForRoadAroundBySide(side, cell);
                });
            }
            semi.colorCharge = null;
            semi.colorFlow = null;
        }
        this.cacheColorRemove(cell);

        this.refreshVisibleCell(cell);

        if (!checkRun) { checkRun = semi.checkRun = this.checkRun; }
        else if (checkRun == semi.checkRun) { return; }
        semi.checkRun = checkRun;

        if (cell.isAwakeSemiconductor) {
            SIDES.forEach((side: DirSide) => {
                let cellSideSemi = this.scheme.findCellOfSemiconductor(HH[side](cell));
                if (!cellSideSemi) { return; }
                this.setAwakeColorToSemiconductor(cellSideSemi, color, false, checkRun);
            });
        }
    }

    private setChargeColorToSemiconductor(cell: ICellWithSemiconductor, checkRun: number | null = null, removeMode: boolean = false) : void {
        let semi = cell.semiconductor;
        semi.colorCharge = removeMode ? null : semi.colorAwake;
        this.cacheColorRemove(cell);

        this.refreshVisibleCell(cell);

        if (!checkRun) { checkRun = this.checkRun; }
        else if (checkRun == semi.checkRun) { return; }
        semi.checkRun = checkRun;

        SIDES.forEach((side: DirSide) => {
            let cellSideSemi = this.scheme.findCellOfSemiconductor(HH[side](cell));
            if (!cellSideSemi) { return; }
            this.setChargeColorToSemiconductor(cellSideSemi, checkRun, removeMode);
        });

        if (!removeMode && cell.isSleepSemiconductor) {
            let color: ContentColor;
            let fromDir: DirSide;
            if (semi.direction == CONF.ROAD_LEFT_RIGHT) {
                color = cell.colorOfConnectedColoredRoadAtSideThatFlowsHere(CONF.LEFT); fromDir = CONF.LEFT;
                if (!color) { color = cell.colorOfConnectedColoredRoadAtSideThatFlowsHere(CONF.RIGHT); fromDir = CONF.RIGHT; }
            }
            else {
                color = cell.colorOfConnectedColoredRoadAtSideThatFlowsHere(CONF.UP); fromDir = CONF.UP;
                if (!color) { color = cell.colorOfConnectedColoredRoadAtSideThatFlowsHere(CONF.DOWN); fromDir = CONF.DOWN; }
            }
            if (color) {
                this.contentCellAdd(cell.poss);
            }
        }
    }

    private setChargeColorToSemiconductorByRoad(color: ContentColor, fromDir: DirSide, cell: ICellWithSemiconductor) : void {
        if (color && !cell.semiconductor.colorCharge && color == cell.semiconductor.colorAwake) {
            this.setChargeColorToSemiconductor(cell);
        }
        else if (!color && cell.semiconductor.colorCharge) {
            this.setChargeColorToSemiconductor(cell, null, true);
            this.eraseFlowColorOnNextSemiconductor(fromDir, cell);
        }
    }

    private setFlowColorToSemiconductor(color: number, fromDir: DirSide, cell: ICellWithSemiconductor): void {
        let semi = cell.semiconductor;
        if (semi.colorFlow || !semi.colorCharge) { return; }

        semi.colorFlow = color;
        semi.from = fromDir;
        this.refreshVisibleCell(cell);

        if (cell.isAwakeSemiconductor) {
            SIDES.map((toDir: DirSide) => {
                if (toDir == fromDir) { return; }
                let possSide = HH[toDir](cell);
                this.cacheColorAdd(possSide, {
                    type: CONF.ST_ROAD_SLEEP,
                    method: 'moveColorToSemiconductorBySemiconductor',
                    params: [color, CONF.OPPOSITE_SIDE[toDir], possSide],
                    cacheDirections: [toDir, CONF.OPPOSITE_SIDE[toDir]],
                });
            })
        }
        else if (cell.isSleepSemiconductor) {
            let possSide = HH[CONF.OPPOSITE_SIDE[fromDir]](cell);
            this.cacheColorAdd(possSide, {
                type: CONF.ST_ROAD,
                method: 'moveColorToRoadBySemiconductor',
                params: [color, fromDir, possSide],
                cacheDirections: [fromDir, CONF.OPPOSITE_SIDE[fromDir]],
            });
        }
    }

    private setFlowColorToSemiconductorByRoad(color: ContentColor, fromDir: DirSide, cell: ICellWithSemiconductor): void {
        if (!cell.isSleepSemiconductor) { return; }
        let semi = cell.semiconductor;
        if (color && (semi.colorFlow || !semi.colorCharge)) { return; }

        semi.colorFlow = color;
        semi.from = fromDir;
        this.refreshVisibleCell(cell);
        if (!color) { this.cacheColorRemove(cell); }

        let toDir = CONF.OPPOSITE_SIDE[fromDir];
        let possSide = HH[toDir](cell);
        if (color) {
            this.cacheColorAdd(possSide, {
                type: CONF.ST_ROAD_SLEEP,
                method: 'moveColorToSemiconductorBySemiconductor',
                params: [color, CONF.OPPOSITE_SIDE[toDir], possSide],
                cacheDirections: [toDir, CONF.OPPOSITE_SIDE[toDir]],
            });
        }
        else {
            this.eraseFlowColorOnNextSemiconductor(CONF.OPPOSITE_SIDE[toDir], possSide);
            this.scheme.eraseColorOnRoadPathFromSide(null, semi.from, possSide);
        }
    }

    private eraseFlowColorOnNextSemiconductor(fromDir: DirSide, poss: IPoss) {
        let cell = this.scheme.findCellOfSemiconductor(poss);
        if (!cell) { return; }

        cell.semiconductor.colorFlow = null;
        this.refreshVisibleCell(cell);
        this.cacheColorRemove(cell);

        if (cell.isAwakeSemiconductor) {
            SIDES.map((toDir: DirSide) => {
                if (toDir == fromDir) { return; }
                this.eraseFlowColorOnNextSemiconductor(CONF.OPPOSITE_SIDE[toDir], HH[toDir](poss));
            })
        }
        else if (cell.isSleepSemiconductor && cell.colorOfConnectedColoredRoadAtSideThatFlowsOutHere(CONF.OPPOSITE_SIDE[fromDir])) {
            this.scheme.eraseColorOnRoadPathFromSide(null, fromDir, HH[CONF.OPPOSITE_SIDE[fromDir]](poss));
        }
    }

    private removeChargeColorFromSemiconductor(cell: ICellWithSemiconductor) : void {
        this.setChargeColorToSemiconductor(cell, null, true);
    }

    private turnSleepSemiconductorHere(cell: ICellWithSemiconductor, poss: IPoss) : void {
        if (!cell.isAwakeSemiconductor) { return; }

        SIDES.forEach((side) => {
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

    private hasSemiCellTheAwakeSources(cell: ICellWithSemiconductor) : boolean {
        for (let side of SIDES) {
            if (this.scheme.findCellOfStone(HH[side](cell))) {
                return true; // works only for transistor with 2 awake semiconductors
            }
        }
        return false;
    }

    private hasSemiAwakeClusterTheAwakeSources(cell: ICellWithSemiconductor) : boolean {
        if (!cell.isAwakeSemiconductor) { return false; }
        return this.hasSemiCellTheAwakeSources(cell) || this.hasSemiCellNeighbourTheAwakeSources(cell);
    }

    private hasSemiCellTheChargeSources(cell: ICellWithSemiconductor) : boolean {
        for (let side of SIDES) {
            let color = cell.colorOfConnectedColoredRoadAtSideThatFlowsHere(side);
            if (color && cell.semiconductor.colorCharge == color) {
                return true; // works only for transistor with 2 awake semiconductors
            }
        }
        return false;
    }

    private hasSemiAwakeClusterTheChargeSources(cell: ICellWithSemiconductor) : boolean {
        if (!cell.isAwakeSemiconductor) { return false; }
        return this.hasSemiCellTheChargeSources(cell) || this.hasSemiCellNeighbourTheChargeSources(cell);
    }

    private hasSemiCellNeighbourTheAwakeSources(cell: ICellWithSemiconductor) : boolean {
        for (let side of SIDES) { // works only for transistor with 2 awake semiconductors
            let sideCell = this.scheme.findCellOfSemiconductor(HH[side](cell));
            if (!sideCell?.isAwakeSemiconductor) { continue; }
            if (this.hasSemiCellTheAwakeSources(sideCell)) { return true; }
        }
        return false;
    }

    private hasSemiCellNeighbourTheChargeSources(cell: ICellWithSemiconductor) : boolean {
        for (let side of SIDES) { // works only for transistor with 2 awake semiconductors
            let sideCell = this.scheme.findCellOfSemiconductor(HH[side](cell));
            if (!sideCell?.isAwakeSemiconductor) { continue; }
            if (this.hasSemiCellTheChargeSources(sideCell)) { return true; }
        }
        return false;
    }
}