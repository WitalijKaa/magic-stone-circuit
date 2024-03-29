import * as CONF from "../../config/game";
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../../config/game";
import {AbstractComponent} from "./AbstractComponent";
import {ContentColor} from "../Types/ColorTypes";
import {DirSide} from "../Types/DirectionSide";
import {IPoss} from "../IPoss";
import {CellStoneType} from "../Types/CellStone";

export class SmileComponent extends AbstractComponent {

    public putSmile(logic: string = 'True') : void {
        let cell = this.getCell(this._devCell);
        cell.smile = { type: CONF.ST_SMILE_IN, color: null, view: false, logic: logic };
        this.getCell(cell.cellPosition.Up).smile = { type: CONF.ST_SMILE, color: null, view: false, logic: logic };
        this.getCell(cell.cellPosition.Right).smile = { type: CONF.ST_SMILE, color: null, view: true, logic: logic };
        this.getCell(cell.cellPosition.Up.Right).smile = { type: CONF.ST_SMILE, color: null, view: false, logic: logic };

        this.refreshVisibleCell(cell.cellPosition.Right);
    }

    public setColorToSmileByRoad(color: ContentColor, fromDir: DirSide, poss: IPoss) : void {
        if (![LEFT, DOWN].includes(fromDir)) { return; }
        let cell = this.findCell(poss);
        if (!cell || !cell.smile || CONF.ST_SMILE_IN != cell.smile.type) { return; }

        if (!this['logic' + cell.smile.logic](color)) { color = null; }

        if (cell.Right!.smile!.event) {
            cell.Right!.smile!.event(color);
        }

        cell.Right!.smile!.color = color;
        this.refreshVisibleCell(cell.cellPosition.Right);
    }

    private logicTrue() : boolean {
        return true;
    }

    private logicViolet(color: ContentColor) : boolean {
        return color == CONF.COLOR_VIOLET_ROAD;
    }
    private logicRed(color: ContentColor) : boolean {
        return color == CONF.COLOR_RED_ROAD;
    }
    private logicIndigo(color: ContentColor) : boolean {
        return color == CONF.COLOR_INDIGO_ROAD;
    }
    private logicOrange(color: ContentColor) : boolean {
        return color == CONF.COLOR_ORANGE_ROAD;
    }

    private logicSwitcherTrue(color: ContentColor) : boolean {
        let switcher = this.findCell({x: 800000012, y: 800000009});
        if (!switcher || !switcher.switcher) { return false; }
        return color == CONF.STONE_TYPE_TO_ROAD_COLOR[switcher.switcher.type];
    }

    private logicSwitcherOpposite(color: ContentColor) : boolean {
        let switcher = this.findCell({x: 800000012, y: 800000009});
        if (!switcher || !switcher.switcher || 2 != switcher.switcher.range.length) { return false; }
        let oppositeSwitcherType = [...switcher.switcher.range]
            .filter((rangeColor) => { return rangeColor != switcher!.switcher!.type })
            .pop() as CellStoneType;
        return color == CONF.STONE_TYPE_TO_ROAD_COLOR[oppositeSwitcherType];
    }
}