import * as CONF from "../../config/game";
import {TT} from "../../config/textures";
import {CellGrid} from "./CellGrid";
import {SpriteModel} from "../SpriteModel";

const TT_ROAD = {
    [CONF.ROAD_PATH_UP]: TT.roadR,
    [CONF.ROAD_PATH_RIGHT]: TT.roadR,
    [CONF.ROAD_PATH_DOWN]: TT.roadL,
    [CONF.ROAD_PATH_LEFT]: TT.roadL,
    [CONF.ROAD_PATH_HEAVY]: TT.roadH,
}

export class CellRoad {

    isRoad = false;
    paths: Array<SpriteModel | null> = [null, null, null, null, null];

    constructor(private cell: CellGrid) { }

    public updateVisibleRoad() : void {
        if (this.cell.schemeCell?.road) {
            this.cell.schemeCell.road.paths.map((path, ix) => {
                if (path && !this.paths[ix]) {
                    let model = new SpriteModel(TT_ROAD[ix]);
                    this.cell.model.addChild(model.model);
                    if (ix == CONF.ROAD_PATH_UP || ix == CONF.ROAD_PATH_DOWN) {
                        model.centeredPivot = true;
                        model.model.angle = 90
                    }
                    this.paths[ix] = model;
                }
                else if (!path && this.paths[ix]) {
                    // @ts-ignore
                    this.paths[ix].destroy();
                    this.paths[ix] = null;
                }
            })

            this.isRoad = false;
            this.paths.map((path) => {
                if (path) { this.isRoad = true; }
            })
        }
        else if (this.isRoad) {
            this.paths = this.paths.map((path) => {
                if (path) {
                    path.destroy();
                }
                return null;
            })
            this.isRoad = false;
        }
    }
}