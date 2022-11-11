import {ICellScheme} from "./ICellScheme";
import {CellTrigger} from "../Types/CellTrigger";

export interface ICellWithTrigger extends ICellScheme {
    trigger: CellTrigger;
}