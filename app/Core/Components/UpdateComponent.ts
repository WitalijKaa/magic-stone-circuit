import {AbstractComponent} from "./AbstractComponent";
import {HH} from "../HH";
import * as CONF from "../../config/game";
import {DOWN, LEFT, RIGHT, ROAD_LEFT_RIGHT, SIDES, UP} from "../../config/game";
import {ColorCellCache} from "../Types/ColorCellCache";
import {IPoss} from "../IPoss";
import {DirSide} from "../Types/DirectionSide";

const MIN_SPEED = 40;
const MAX_SPEED = 200;

export class UpdateComponent extends AbstractComponent {
    
    public gameBlock: boolean = false;

    // SPEED

    private _gameSpeedMs: number = 60;
    private get gameSpeedMs() : number {
        if (this.isSchemeLevelMode) { return 25; }
        return this._gameSpeedMs;
    }

    public speedUp() : void {
        this._gameSpeedMs -= 20;
        if (this._gameSpeedMs < MIN_SPEED) { this._gameSpeedMs = MIN_SPEED - 10; }
    }
    public speedDown() : void {
        this._gameSpeedMs += 30;
        if (this._gameSpeedMs > MAX_SPEED) { this._gameSpeedMs = MAX_SPEED; }
    }

    // CACHE

    private updateActs: { [key: string]: Array<ColorCellCache> } = {};
    private removeActs: Array<{poss: IPoss, toDir: null | DirSide}> = [];

    public cacheAddAct(poss: IPoss, cache: ColorCellCache) : void {
        let name = HH.cellName(poss);
        if (!this.updateActs[name]) { this.updateActs[name] = []; }
        this.updateActs[name].push(cache);
    }

    public cacheRemoveAct(poss: IPoss) : void { this.removeActs.push({ poss: poss, toDir: null }); }

    public cacheRemoveActOfColorToDir(toDir: DirSide, poss: IPoss) : void { this.removeActs.push({ poss: poss, toDir: toDir }); }

    protected useRemoveCacheAct(act: {poss: IPoss, toDir: null | DirSide}) : void {
        let name = HH.cellName(act.poss);
        if (act.toDir) {
            if (this.updateActs[name]) {
                for (let ix = this.updateActs[name].length - 1; ix >= 0; ix--) {
                    let cache = this.updateActs[name][ix];
                    if (cache.cacheDirections.includes(act.toDir)) {
                        this.updateActs[name].splice(ix, 1);
                    }
                }
            }
        }
        else { this.updateActs[name] = []; }
    }

    public cacheReset() : void {
        this.gameBlock = false;
        this.updateActs = {};
        this.contentReUpdate = 10;
    }

    // UPDATE

    private contentReUpdate: number = 2; // stones tries to act again
    private contentReUpdateNext: number = 4;

    public update() : void {
        if (this.gameBlock) {
            setTimeout(() => { this.update() }, 1);
            return;
        }

        this.gameBlock = true;
        if (!this.actionAlphaTick())
        {
            this.removeActs.forEach((act) => { this.useRemoveCacheAct(act) });
            this.removeActs = [];

            let cacheActs = this.updateActs;
            this.updateActs = {};

            for (let cacheName in cacheActs) {
                for (let cache of cacheActs[cacheName]) {
                    this.scheme[cache.method](...cache.params);
                }
            }
            this.scheduleContentReUpdate();
            this.scheme.roadColoringFinalHandler();
        }
        this.gameBlock = false;
        setTimeout(() => { this.update() }, this.gameSpeedMs);
    }
    
    private scheduleContentReUpdate() : void {
        this.contentReUpdate--;
        if (this.contentReUpdate < 1) {
            this.contentReUpdate = this.contentReUpdateNext;

            for (let cellName in this.scheme.contentCells) {
                let cell = this.findCell(this.scheme.contentCells[cellName]);
                if (!cell) { return; }

                if (cell.content) {
                    this.cacheAddAct(cell.poss, {
                        type: CONF.ST_STONE_VIOLET,
                        method: 'colorItAroundByStone',
                        params: [this.scheme.contentCells[cellName]],
                        cacheDirections: [...CONF.SIDES],
                    });
                }
                else if (cell.isSleepSemiconductor) {
                    this.cacheAddAct(cell.poss, {
                        type: CONF.ST_ROAD_SLEEP,
                        method: 'colorItAroundBySleepSemiconductor',
                        params: [cell.poss],
                        cacheDirections: cell.semiconductor!.direction == CONF.ROAD_LEFT_RIGHT ? [LEFT, RIGHT] : [UP, DOWN],
                    });
                }
                else if (cell.trigger && cell.trigger.color) {
                    this.cacheAddAct(cell.poss, {
                        type: CONF.ST_TRIGGER,
                        method: 'colorItAroundByTrigger',
                        params: [this.scheme.contentCells[cellName]],
                        cacheDirections: [RIGHT],
                    });
                }
                else if (cell.speed && cell.speed.color) {
                    this.cacheAddAct(cell.poss, {
                        type: CONF.ST_SPEED,
                        method: 'colorItAroundBySpeed',
                        params: [this.scheme.contentCells[cellName]],
                        cacheDirections: [cell.speed.to],
                    });
                }
                else if (cell.switcher) {
                    this.cacheAddAct(cell.poss, {
                        type: CONF.ST_STONE_RED,
                        method: 'colorItAroundBySwitcher',
                        params: [this.scheme.contentCells[cellName]],
                        cacheDirections: [RIGHT],
                    });
                }
                else if (cell.gen) {
                    this.cacheAddAct(cell.poss, {
                        type: CONF.ST_GEN,
                        method: 'colorItAroundByGen',
                        params: [this.scheme.contentCells[cellName]],
                        cacheDirections: [...CONF.SIDES],
                    });
                }
            }

        }
    }
}