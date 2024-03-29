import {ICellScheme} from "./ICellScheme";
import {CellSpeed} from "../Types/CellSpeed";

export interface ICellWithSpeed extends ICellScheme {
    speed: CellSpeed;

    get isSpeedToUpOrDown() : boolean;
    get isSpeedToLeftOrRight() : boolean;
}