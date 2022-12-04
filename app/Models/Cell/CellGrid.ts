import * as CONF from "../../config/game";
import {TT} from "../../config/textures";
import {Cell} from "../../Core/Cell";
import {SchemeGrid} from "../Scheme/SchemeGrid";
import {CellAbstract} from "./CellAbstract";
import {SpriteModel} from "../SpriteModel";
import {IPoss} from "../../Core/IPoss";
import {CellScheme} from "../../Core/CellScheme";
import {CellContent} from "./CellContent";
import {MouseClick} from "../../Core/Behaviors/MouseClick";
import {CellRoad} from "./CellRoad";
import {MouseOver} from "../../Core/Behaviors/MouseOver";
import {HH} from "../../Core/HH";
import {CellSemiconductor} from "./CellSemiconductor";
import {CellSmile} from "./CellSmile";
import {CellTrigger} from "./CellTrigger";
import {CellSpeed} from "./CellSpeed";
import {CellBorder} from "./CellBorder";
import {CellGhost} from "./CellGhost";

export class CellGrid extends CellAbstract {

    private cellContent: CellContent;
    private cellRoad: CellRoad;
    private cellSemiconductor: CellSemiconductor;
    private cellTrigger: CellTrigger;
    private cellSpeed: CellSpeed;
    private cellBorder: CellBorder;
    private cellSmile: CellSmile;
    private cellGhost: CellGhost;

    constructor(position: Cell, grid: SchemeGrid) {
        super(position, grid, SpriteModel.from(TT.cell));

        this.cellContent = new CellContent(this);
        this.cellRoad = new CellRoad(this);
        this.cellSemiconductor = new CellSemiconductor(this);
        this.cellTrigger = new CellTrigger(this);
        this.cellSpeed = new CellSpeed(this);
        this.cellSmile = new CellSmile(this);
        this.cellBorder = new CellBorder(this);
        this.cellGhost = new CellGhost(this);

        this.on('click', () => { this.handleClick() });
        this.on('tap', () => { this.handleClick(true) });
        new MouseClick(this, this, { [MouseClick.CLICK_RIGHT]: 'handleRightClick' });
        new MouseOver(this, this, { [MouseOver.MOUSE_OVER]: 'handleMouseOver' });
    }

    public get defaultTexture () : string { return TT.cell; }

    handleClick(tapMode: boolean = false) {
        if (tapMode) {
            this.grid.hidePointerZone();
        }

        if (!this.scheme.inputAllowed) { return; }

        if (HH.isRoad(this.grid.controlPen)) {
            if (tapMode) {
                this.scheme.putRoadSmart(this.schemePosition);
            }
            else {
                if (!this.scheme.isRoadBuildMode) {
                    this.scheme.startToBuildRoad(this.schemePosition);
                }
                else {
                    this.scheme.finishToBuildRoad();
                }
            }
        }
        else {
            this.scheme.cancelToBuildRoad();

            if (HH.isStone(this.grid.controlPen)) {
                this.scheme.anyClick(this.schemePosition);

                // let cell = this.scheme.findCellOfContent(this.schemePosition);
                // if (cell && cell.content.range.length) { return; }

                this.scheme.putStone(this.grid.controlPen, this.schemePosition);
            }
            else if (HH.isSemiconductor(this.grid.controlPen)) {
                this.scheme.anyClick(this.schemePosition);
                this.scheme.putSemiconductor(this.grid.controlPen, this.schemePosition);
            }
            else if (HH.isTrigger(this.grid.controlPen)) {
                this.scheme.anyClick(this.schemePosition);
                this.scheme.putTrigger(this.schemePosition);
            }
            else if (HH.isSpeed(this.grid.controlPen)) {
                this.scheme.anyClick(this.schemePosition);
                this.scheme.putSpeed(this.schemePosition);
            }
            else if (CONF.ST_EMPTY == this.grid.controlPen) {
                this.scheme.removeContent(this.schemePosition);
                this.scheme.removeRoad(this.schemePosition);
                this.scheme.putSemiconductor(null, this.schemePosition);
                this.scheme.removeTrigger(this.schemePosition);
                this.scheme.removeSpeed(this.schemePosition);
            }
            else if (CONF.ST_BORDER == this.grid.controlPen) {
                this.scheme.createPattern(this.schemePosition);
            }
            else if (CONF.PEN_PUT_PATTERN == this.grid.controlPen) {
                this.scheme.putPattern();
            }
        }
    }
    handleRightClick() {
        this.scheme.cancelPutPattern();
        this.scheme.hidePattern();

        if (CONF.ST_EMPTY == this.grid.controlPen) {
            this.scheme.actionDelete(this.schemePosition);
        }
        else {
            this.scheme.putRoadSmart(this.schemePosition);
        }
    }
    handleMouseOver() { this.scheme.devCell(this.schemePosition); }

    public get schemePosition() : IPoss { return { x: this.grid.dragX + this.gridX, y: this.grid.dragY + this.gridY }; }

    get scheme() { return this.grid.scheme; }
    get schemeCell() : null | CellScheme { return this.grid.scheme.findCell(this.schemePosition) }

    refreshVisibleAll() {
        this.cellSmile.updateVisibleSprites();
        this.cellContent.update();
        this.cellRoad.update();
        this.cellSemiconductor.update();
        this.cellTrigger.update();
        this.cellSpeed.update();
        this.cellBorder.updateVisibleBorder();
        this.cellGhost.update();
    }
}