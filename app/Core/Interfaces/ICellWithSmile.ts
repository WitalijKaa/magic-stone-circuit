import {ICellScheme} from "./ICellScheme";
import {CellSmile} from "../Types/CellSmile";

export interface ICellWithSmile extends ICellScheme {
    smile: CellSmile;
}