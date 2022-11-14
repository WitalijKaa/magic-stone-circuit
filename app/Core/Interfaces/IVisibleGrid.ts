import {IPoss} from "../IPoss";

export interface IVisibleGrid {

    changeScale(change: number) : void;
    setCenter() : void;
    refreshAllCells() : void;
    refreshCell(poss: IPoss) : void;

}