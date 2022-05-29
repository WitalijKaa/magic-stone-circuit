import {CellAbstract} from "./CellAbstract";
import {
    DOWN,
    LEFT,
    OVER_CENTER,
    PIXI_ROTATE_DOWN,
    PIXI_ROTATE_LEFT,
    PIXI_ROTATE_RIGHT, PIXI_ROTATE_UP,
    RIGHT,
    UP
} from "../../config/pixi";
import {SpriteModel} from "../SpriteModel";
import {TT} from "../../config/textures";
import {Cell} from "../../Core/Cell";
import {SchemeGrid} from "../Scheme/SchemeGrid";
import {GridZone} from "../../Core/Types/GridCursor";

export class CellPointer extends CellAbstract {

    zone = OVER_CENTER;
    sidePointer: SpriteModel;

    zoneRotate = {
        [UP]: PIXI_ROTATE_UP,
        [RIGHT]: PIXI_ROTATE_RIGHT,
        [DOWN]: PIXI_ROTATE_DOWN,
        [LEFT]: PIXI_ROTATE_LEFT,
    }
    cellPxSizeConfig: { lineA: number, lineB: number };

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
        this.model.alpha = 1;
        if (OVER_CENTER != zone) {
            this.sidePointer.model.alpha = 1;
        }
        if (zone != this.zone) {
            this.zone = zone;
            if (OVER_CENTER == zone) {
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

    findOverZoneType(pxLocalX: number, pxLocalY: number) : GridZone {
        if (pxLocalY <= this.cellPxSizeConfig.lineA) {
            if (pxLocalX < this.cellPxSizeConfig.lineB) { return UP; }
            return RIGHT;
        }
        if (pxLocalY <= this.cellPxSizeConfig.lineB) {
            if (pxLocalX < this.cellPxSizeConfig.lineA) { return LEFT; }
            if (pxLocalX < this.cellPxSizeConfig.lineB) { return OVER_CENTER; }
            return RIGHT;
        }
        else {
            if (pxLocalX < this.cellPxSizeConfig.lineA) { return LEFT; }
            return DOWN;
        }
    }
    
}