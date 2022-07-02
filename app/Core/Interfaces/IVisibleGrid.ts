import {IPoss} from "../IPoss";

export interface IVisibleGrid {

    setCenter() : void;
    refreshAllCells() : void;
    refreshCell(poss: IPoss) : void;

}