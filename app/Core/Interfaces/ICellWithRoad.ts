import {CellRoad} from "../Types/CellRoad";
import {ICellScheme} from "./ICellScheme";
import {DirSide} from "../Types/DirectionSide";

export interface ICellWithRoad extends ICellScheme {
    road: CellRoad;

    isRoadPathFromSide(side: DirSide) : boolean;
    isColoredRoadPathFromSide(side: DirSide) : boolean;
    isUncoloredRoadPathFromSide(side: DirSide) : boolean;
    isColoredRoadPathFromSideFlowToThatSide(side: DirSide) : boolean;
    isColoredRoadPathFromSideFlowFromThatSide(side: DirSide) : boolean;
}