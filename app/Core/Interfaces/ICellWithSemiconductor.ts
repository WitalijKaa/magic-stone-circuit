import {ICellScheme} from "./ICellScheme";
import {CellSemiconductor} from "../Types/CellSemiconductor";
import {DirSide} from "../Types/DirectionSide";

export interface ICellWithSemiconductor extends ICellScheme {
    semiconductor: CellSemiconductor;

    isAwakeSemiconductorConnectedToAnyOtherSemiconductorAtSide(side: DirSide) : boolean;
    colorOfConnectedColoredRoadAtSideThatFlowsHere(side: DirSide) : number | null;
    colorOfConnectedColoredRoadAtSideThatFlowsOutHere(side: DirSide) : number | null;
    
    get sidesOfSemiconductor() : Array<DirSide>;
}