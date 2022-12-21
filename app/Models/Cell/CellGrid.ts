import * as CONF from "../../config/game";
import {TT} from "../../config/textures";
import {Cell} from "../../Core/Cell";
import {SchemeGrid} from "../Scheme/SchemeGrid";
import {CellAbstract} from "./CellAbstract";
import {SpriteModel} from "../SpriteModel";
import {IPoss} from "../../Core/IPoss";
import {CellScheme} from "../../Core/CellScheme";
import {CellStone} from "./CellStone";
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
import {CellSwitcher} from "./CellSwitcher";

type CellContentOfGrid = null | CellStone | CellRoad | CellSemiconductor | CellTrigger | CellSpeed | CellSmile | CellSwitcher;

export class CellGrid extends CellAbstract {

    private cellContent: CellContentOfGrid = null;
    private cachedSpriteModels: { [key: string]: CellContentOfGrid } = {};
    private cellBorder: CellBorder;
    private cellGhost: CellGhost;

    constructor(position: Cell, grid: SchemeGrid) {
        super(position, grid, SpriteModel.from(TT.cell));

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
                this.scheme.putStone(this.grid.controlPen, this.schemePosition);
            }
            else if (HH.isSemiconductor(this.grid.controlPen)) {
                this.scheme.putSemiconductor(this.grid.controlPen, this.schemePosition);
            }
            else if (HH.isTrigger(this.grid.controlPen)) {
                this.scheme.putTrigger(this.schemePosition);
            }
            else if (HH.isSpeed(this.grid.controlPen)) {
                this.scheme.putSpeed(this.schemePosition);
            }
            else if (CONF.ST_EMPTY == this.grid.controlPen) {
                this.scheme.removeCell(this.schemePosition);
            }
            else if (CONF.ST_BORDER == this.grid.controlPen) {
                this.scheme.createPattern(this.schemePosition);
            }
            else if (CONF.PEN_PUT_PATTERN == this.grid.controlPen) {
                this.scheme.putPattern();
                this.grid.restoreControlPen();
            }
        }
    }
    handleRightClick() {
        this.scheme.cancelPutPattern();
        this.scheme.hidePattern();

        if (CONF.ST_EMPTY == this.grid.controlPen) {
            this.scheme.actionDelete(this.schemePosition);
        }
        else if (CONF.PEN_PUT_PATTERN != this.grid.controlPen) {
            this.scheme.putRoadSmart(this.schemePosition);
        }
        this.grid.restoreControlPen();
    }
    handleMouseOver() { this.scheme.devCell(this.schemePosition); }

    public get schemePosition() : IPoss { return { x: this.grid.dragX + this.gridX, y: this.grid.dragY + this.gridY }; }

    get scheme() { return this.grid.scheme; }
    get schemeCell() : null | CellScheme { return this.grid.scheme.findCell(this.schemePosition) }

    refreshVisibleAll() {
        if (this.cellContent) {
            this.cellContent.update();
        }

        let schemeCellCode = this.schemeCellCode;

        if (this.cellContent && !schemeCellCode || this.cellContent && schemeCellCode != this.cellContent.schemeCode) {
            this.cachedSpriteModels[this.cellContent.schemeCode] = this.cellContent;
            this.cellContent = null;
        }

        if (schemeCellCode && !this.cellContent) {
            this.setCellContentModel(schemeCellCode);

            if (this.cellContent) {
                // @ts-ignore
                this.cellContent.update();
            }
        }

        this.cellBorder.update();
        this.cellGhost.update();
    }

    private setCellContentModel(type: string) : void {
        if (this.cachedSpriteModels[type]) {
            this.cellContent = this.cachedSpriteModels[type];
        }

        if ('content' == type) { this.cellContent = new CellStone(this); }
        else if ('road' == type) { this.cellContent = new CellRoad(this); }
        else if ('semiconductor' == type) { this.cellContent = new CellSemiconductor(this); }
        else if ('speed' == type) { this.cellContent = new CellSpeed(this); }
        else if ('trigger' == type) { this.cellContent = new CellTrigger(this); }
        else if ('switcher' == type) { this.cellContent = new CellSwitcher(this); }
        else if ('smile' == type) { this.cellContent = new CellSmile(this); }
    }

    private get schemeCellCode() : null | string {
        let schemeCell = this.scheme.findCell(this.schemePosition);
        if (!schemeCell) { return null; }

        for (const type of CONF.CELL_VIEW_TYPES) {
            if (type in schemeCell && schemeCell[type]) {
                return type;
            }
        }
        return null;
    }
}