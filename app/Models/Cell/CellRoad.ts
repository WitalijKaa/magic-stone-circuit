import {ROAD_PATH_UP, ROAD_PATH_RIGHT, ROAD_PATH_DOWN, ROAD_PATH_LEFT, ROAD_PATH_HEAVY} from "../../config/game"
import {PIXI_ROTATE_LEFT} from "../../config/game"
import {TT} from "../../config/textures";
import {CellGrid} from "./CellGrid";
import {SpriteModel} from "../SpriteModel";
import {CellPath} from "../../Core/Types/CellRoad";

const TT_ROAD = {
    [ROAD_PATH_UP]: TT.roadR,
    [ROAD_PATH_RIGHT]: TT.roadR,
    [ROAD_PATH_DOWN]: TT.roadL,
    [ROAD_PATH_LEFT]: TT.roadL,
    [ROAD_PATH_HEAVY]: TT.roadH,
}

export class CellRoad {

    private isRoadDrawn: boolean = false;
    private paths: Array<SpriteModel | null> = [null, null, null, null, null];

    constructor(private cell: CellGrid) { }

    public updateVisibleRoad() : void {
        if (this.cell.schemeCell?.road) {
            this.cell.schemeCell.road.paths.map((path: CellPath, ix: number) => {
                if (path && !this.paths[ix]) {
                    this.drawPath(ix);
                }
                else if (!path && this.paths[ix]) {
                    this.paths[ix]!.destroy();
                    this.paths[ix] = null;
                }

                this.paths[ix]?.setColor('boolean' != typeof path ? path.color : null)
            })
            this.isRoadDrawn = this.getRoadDrawnStatus();
        }
        else if (this.isRoadDrawn) {
            this.destroyPaths();
        }
    }

    private drawPath(ix: number) : void {
        let model = new SpriteModel(TT_ROAD[ix]);
        this.cell.model.addChild(model.model);
        if (ix == ROAD_PATH_UP || ix == ROAD_PATH_DOWN) {
            model.centeredPivot = true;
            model.model.angle = PIXI_ROTATE_LEFT
        }
        this.paths[ix] = model;
    }

    private destroyPaths() : void {
        this.paths = this.paths.map((path:SpriteModel | null) => {
            if (path) {
                path.destroy();
            }
            return null;
        })
        this.isRoadDrawn = false;
    }

    private getRoadDrawnStatus() : boolean {
        for (let path of this.paths) {
            if (path) { return true; }
        }
        return false;
    }
}