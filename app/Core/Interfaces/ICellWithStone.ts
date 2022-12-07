import {ICellScheme} from "./ICellScheme";
import {CellStone} from "../Types/CellStone";

export interface ICellWithStone extends ICellScheme {
    content: CellStone;
}