import {AbstractComponent} from "./AbstractComponent";
import {HH} from "../HH";
import * as CONF from "../../config/game";
import {DOWN, LEFT, RIGHT, ROAD_LEFT_RIGHT, UP} from "../../config/game";
import {ColorCellCache} from "../Types/ColorCellCache";
import {IPoss} from "../IPoss";
import {DirSide} from "../Types/DirectionSide";

const MIN_SPEED = 40;
const MAX_SPEED = 200;

export class UpdateComponent extends AbstractComponent {
    
    public gameBlock: boolean = false;
    private cacheMoveBlock: boolean = false;
    private cacheEditBlock: boolean = false;
    private cacheAwaitAddBlock: number = 0;
    private cacheAwaitRemoveBlock: number = 0;

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
    private updateActsNext: { [key: string]: Array<ColorCellCache> } = {};

    public cacheAddAct(poss: IPoss, cache: ColorCellCache) : void {
        if (this.cacheEditBlock) {
            this.cacheAwaitAddBlock++;
            setTimeout(() => { this.cacheAwaitAddBlock--; this.cacheAddAct(poss, cache) }, 1);
            return;
        }

        this.cacheEditBlock = true;
        let cacheActs = this.gameBlock ? this.updateActsNext : this.updateActs;
        if (this.cacheMoveBlock) { cacheActs = this.updateActs; }

        let name = HH.cellName(poss);
        if (!cacheActs[name]) { cacheActs[name] = []; }
        cacheActs[name].push(cache);

        this.cacheEditBlock = false;
    }

    public cacheRemoveAct(poss: IPoss) : void {
        if (this.cacheEditBlock || this.gameBlock || this.cacheMoveBlock || this.cacheAwaitAddBlock > 0) {
            this.cacheAwaitRemoveBlock++;
            setTimeout(() => { this.cacheAwaitRemoveBlock--; this.cacheRemoveAct(poss); }, 1);
            return;
        }

        this.cacheEditBlock = true;
        let name = HH.cellName(poss);
        this.updateActs[name] = [];
        this.updateActsNext[name] = [];
        this.cacheEditBlock = false;
    }

    public cacheRemoveActOfColorToDir(toDir: DirSide, poss: IPoss) : void {
        if (this.cacheEditBlock || this.gameBlock || this.cacheMoveBlock || this.cacheAwaitAddBlock > 0) {
            this.cacheAwaitRemoveBlock++;
            setTimeout(() => { this.cacheAwaitRemoveBlock--; this.cacheRemoveActOfColorToDir(toDir, poss); }, 1);
            return;
        }

        this.cacheEditBlock = true;
        let name = HH.cellName(poss);
        if (this.updateActs[name]) {
            for (let ix = this.updateActs[name].length - 1; ix >= 0; ix--) {
                let cache = this.updateActs[name][ix];
                if (cache.cacheDirections.includes((toDir))) {
                    this.updateActs[name].splice(ix, 1);
                }
            }
        }
        if (this.updateActsNext[name]) {
            for (let ix = this.updateActsNext[name].length - 1; ix >= 0; ix--) {
                let cache = this.updateActsNext[name][ix];
                if (cache.cacheDirections.includes((toDir))) {
                    this.updateActsNext[name].splice(ix, 1);
                }
            }
        }
        this.cacheEditBlock = false;
    }

    cacheReset() : void {
        this.gameBlock = false;
        this.cacheMoveBlock = false;
        this.cacheEditBlock = false;
        this.updateActs = {};
        this.updateActsNext = {};
        this.contentReUpdate = 10;
    }

    private flashNextActs() : void {
        let next = this.updateActsNext;
        this.updateActsNext = {};

        for (let cacheName in next) {
            if (!this.updateActs[cacheName]) { this.updateActs[cacheName] = []; }
            this.updateActs[cacheName].push(...next[cacheName]);
        }
    }

    // UPDATE

    private contentReUpdate: number = 2; // stones tries to act again
    private contentReUpdateNext: number = 4;

    public update() : void {
        if (this.cacheEditBlock || this.cacheAwaitAddBlock > 0 || this.cacheAwaitRemoveBlock > 0) {
            setTimeout(() => { this.update() }, 1);
            return;
        }

        this.gameBlock = true;
        if (!this.actionAlphaTick())
        {
            let cacheActs = this.updateActs;
            this.updateActs = {};

            for (let cacheName in cacheActs) {
                for (let cache of cacheActs[cacheName]) {
                    this.scheme[cache.method](...cache.params);
                }
            }

            // for (let cacheName in this.activeCacheColorings) {
            //     for (let cache of this.activeCacheColorings[cacheName]) {
            //         if (cache.method == 'execMoveColorToNextPaths') { roadColoringProcess = true; }
            //
            //         this[cache.method](...cache.params);
            //     }
            // }
            //
            // if (roadColoringProcess) {
            //     this.updatePauseLastMoment = HH.timestamp();
            // }
            // else {
            //     this.roadColoringFinalHandler();
            // }
            this.scheduleContentReUpdate();
        }
        this.cacheMoveBlock = true;
        this.gameBlock = false;
        this.flashNextActs();
        this.cacheMoveBlock = false;
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
                        method: 'setColorForRoadsAroundByStone',
                        params: [this.scheme.contentCells[cellName]],
                        cacheDirections: [...CONF.SIDES],
                    });
                }
                else if (cell.semiconductor && CONF.ST_ROAD_SLEEP == cell.semiconductor.type) {
                    this.cacheAddAct(cell.poss, {
                        type: CONF.ST_ROAD_SLEEP,
                        method: 'setColorToRoadBySleepSemiconductor',
                        params: [false, this.scheme.contentCells[cellName]],
                        cacheDirections: ROAD_LEFT_RIGHT == cell.semiconductor.direction ? [LEFT, RIGHT] : [UP, DOWN],
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
            }

        }
    }
}