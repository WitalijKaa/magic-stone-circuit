import {ICellScheme} from "./ICellScheme";
import {CellSwitcher} from "../Types/CellSwitcher";

export interface ICellWithSwitcher extends ICellScheme {
    switcher: CellSwitcher;
}