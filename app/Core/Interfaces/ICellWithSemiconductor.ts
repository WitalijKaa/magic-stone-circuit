import {ICellScheme} from "./ICellScheme";
import {CellSemiconductor} from "../Types/CellSemiconductor";
import {DirSide} from "../Types/DirectionSide";

export interface ICellWithSemiconductor extends ICellScheme {
    semiconductor: CellSemiconductor;

    countAwakeClusterAtSide(checkRun, side) : number
    isAwakeSemiconductorConnectedToAnyOtherSemiconductorAtSide(side: DirSide) : boolean;
    colorOfConnectedColoredRoadAtSideThatFlowsHere(side: DirSide) : number | null;
    colorOfConnectedColoredRoadAtSideThatFlowsOutHere(side: DirSide) : number | null;
    
    get isAnyRoadAround() : boolean;
    get isAnyRoadLeftOrRight() : boolean;
    get isSemiconductorChargedAround() : boolean;
    get isSemiconductorSleepAround() : boolean;
    get isSemiconductorAwakeAround() : boolean;
    get sidesOfSemiconductor() : Array<DirSide>;
}