import {CellScheme} from "../CellScheme";
import {Cell} from "../Cell";
import {DirSide} from "../Types/DirectionSide";
import {IPoss} from "../IPoss";
import {SchemeBase} from "../SchemeBase";
import {CellRoad} from "../Types/CellRoad";
import {ICellWithRoad} from "./ICellWithRoad";

export interface ICellScheme extends IPoss {

    cellPosition: Cell;
    scheme: SchemeBase;

    get poss() : IPoss;
    get isAllSidesPathsExist() : boolean;

    isAtPosition(poss: IPoss) : boolean;
    isCellConnectedAtSide(side: DirSide) : boolean;
    isCellConnectedToUncoloredRoadAtSide(side: DirSide) : boolean;
    isRoadSideCellConnected(sideCell: ICellWithRoad, sideOfSideCell: DirSide) : boolean

    get isAwakeSemiconductor() : boolean;
    get isSleepSemiconductor() : boolean;

    getColorOfPath(road: CellRoad, sideOfPath: DirSide, flowFromDir: DirSide) : number | null;

    get isSpeedToUpOrDown() : boolean;
    get isSpeedToLeftOrRight() : boolean;

    get up() : CellScheme | null;
    get right() : CellScheme | null;
    get down() : CellScheme | null;
    get left() : CellScheme | null;

    get Up() : CellScheme | null;
    get Right() : CellScheme | null;
    get Down() : CellScheme | null;
    get Left() : CellScheme | null;
}