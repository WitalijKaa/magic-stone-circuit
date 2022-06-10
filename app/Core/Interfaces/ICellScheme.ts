import {CellScheme} from "../CellScheme";
import {Cell} from "../Cell";

export interface ICellScheme {

    cellPosition: Cell;

    get isEmptyAround() : boolean;
    get isSidesPathsAllExist() : boolean;
    isCellConnectedAtSide(side: string) : boolean;

    get up() : CellScheme | null;
    get right() : CellScheme | null;
    get down() : CellScheme | null;
    get left() : CellScheme | null;
}