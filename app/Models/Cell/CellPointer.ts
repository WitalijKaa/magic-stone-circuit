import * as CONF from "../../config/game";
import {TT} from "../../config/textures";
import {CellAbstract} from "./CellAbstract";
import {SpriteModel} from "../SpriteModel";
import {Cell} from "../../Core/Cell";
import {SchemeGrid} from "../Scheme/SchemeGrid";
import {GridZone} from "../../Core/Types/GridCursor";

export class CellPointer extends CellAbstract {

    zone = CONF.OVER_CENTER;
    sidePointer: SpriteModel;

    zoneRotate = {
        [CONF.UP]: CONF.PIXI_ROTATE_UP,
        [CONF.RIGHT]: CONF.PIXI_ROTATE_RIGHT,
        [CONF.DOWN]: CONF.PIXI_ROTATE_DOWN,
        [CONF.LEFT]: CONF.PIXI_ROTATE_LEFT,
    }
    cellPxSizeConfig: { lineA: number, lineB: number };

    private hideForever: boolean = false;

    constructor(grid: SchemeGrid) {
        super(new Cell(0, 0), grid, SpriteModel.from(TT.zoneCenter));
        this.model.alpha = 0;

        this.sidePointer = new SpriteModel(TT.zoneSide);
        this.sidePointer.centeredPivot = true;
        this.sidePointer.model.alpha = 0;

        this.model.addChild(this.sidePointer.model);

        this.cellPxSizeConfig = {
            lineA: Math.floor(this.grid.cellSizePx / 3),
            lineB: Math.floor(this.grid.cellSizePx / 3) + Math.floor(this.grid.cellSizePx / 3),
        };
    }

    showZone(zone: GridZone, xCell: number, yCell: number) {
        if (this.hideForever) { return; }

        this.model.alpha = 1;
        if (CONF.OVER_CENTER != zone) {
            this.sidePointer.model.alpha = 1;
        }
        if (zone != this.zone) {
            this.zone = zone;
            if (CONF.OVER_CENTER == zone) {
                this.sidePointer.model.alpha = 0;
                return;
            }
            else {
                this.sidePointer.model.angle = this.zoneRotate[zone];
            }
        }

        this.setPosition(xCell, yCell);
    }

    hideZone() {
        this.model.alpha = 0;
        this.sidePointer.model.alpha = 0;
    }

    hideZoneForever() {
        this.hideZone();
        this.hideForever = true;
    }

    findOverZoneType(pxLocalX: number, pxLocalY: number) : GridZone {
        if (pxLocalY <= this.cellPxSizeConfig.lineA) {
            if (pxLocalX < this.cellPxSizeConfig.lineB) { return CONF.UP; }
            return CONF.RIGHT;
        }
        if (pxLocalY <= this.cellPxSizeConfig.lineB) {
            if (pxLocalX < this.cellPxSizeConfig.lineA) { return CONF.LEFT; }
            if (pxLocalX < this.cellPxSizeConfig.lineB) { return CONF.OVER_CENTER; }
            return CONF.RIGHT;
        }
        else {
            if (pxLocalX < this.cellPxSizeConfig.lineA) { return CONF.LEFT; }
            return CONF.DOWN;
        }
    }
    
}