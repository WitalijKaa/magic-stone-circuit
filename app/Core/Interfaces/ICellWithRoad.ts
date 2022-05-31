import {CellRoad} from "../Types/CellRoad";
import {ICellScheme} from "./ICellScheme";

export interface ICellWithRoad extends ICellScheme {
    road: CellRoad;
}