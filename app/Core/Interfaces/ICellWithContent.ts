import {ICellScheme} from "./ICellScheme";
import {CellStone} from "../Types/CellStone";

export interface ICellWithContent extends ICellScheme {
    content: CellStone;
}