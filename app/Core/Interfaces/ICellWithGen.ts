import {ICellScheme} from "./ICellScheme";
import {CellGen} from "../Types/CellGen";

export interface ICellWithGen extends ICellScheme {
    gen: CellGen;
}