import {IPoss} from "../IPoss";

export interface IVisibleGrid {

    refreshAllCells() : void;
    refreshCell(poss: IPoss) : void;

}