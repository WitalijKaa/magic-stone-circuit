import {CellScheme} from "../CellScheme";
import {Cell} from "../Cell";
import {DirSide} from "../Types/DirectionSide";
import {IPoss} from "../IPoss";

export interface ICellScheme extends IPoss {

    cellPosition: Cell;

    get isEmptyAround() : boolean;
    get isSidesPathsAllExist() : boolean;
    isCellConnectedAtSide(side: DirSide) : boolean;

    get up() : CellScheme | null;
    get right() : CellScheme | null;
    get down() : CellScheme | null;
    get left() : CellScheme | null;
}