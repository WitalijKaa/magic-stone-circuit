import {ROAD_PATH_UP, ROAD_PATH_RIGHT, ROAD_PATH_DOWN, ROAD_PATH_LEFT, ROAD_PATH_HEAVY} from "../../config/game"
import {PIXI_ROTATE_LEFT} from "../../config/game"
import {TT} from "../../config/textures";
import {CellGrid} from "./CellGrid";
import {SpriteModel} from "../SpriteModel";
import {CellPath} from "../../Core/Types/CellRoad";
import {CellRoad as CellRoadOfScheme} from "../../Core/Types/CellRoad";
import {ContentColor} from "../../Core/Types/ColorTypes";
import * as CONF from "../../config/game";

const TT_ROAD = {
    [ROAD_PATH_UP]: 'roadR',
    [ROAD_PATH_RIGHT]: 'roadR',
    [ROAD_PATH_DOWN]: 'roadL',
    [ROAD_PATH_LEFT]: 'roadL',
    [ROAD_PATH_HEAVY]: 'roadH',
} as const;

const COLOR_TO_VAR = ['', 'V', 'R', 'I', 'O'];

export class CellRoad {

    private isRoadDrawn: boolean = false;
    private paths: Array<SpriteModel | null> = [null, null, null, null, null];
    private pathsColorsIXs: Array<number> = [0, 0, 0, 0, 0];

    constructor(private cell: CellGrid) { }

    public updateVisibleRoad() : void {
        if (this.cell.schemeCell?.road) {
            this.cell.schemeCell.road.paths.forEach((path: CellPath, ix: number) => {
                let color: number | null = 'boolean' != typeof path ? path.color : null;

                if (path && !this.paths[ix]) {
                    this.drawPath(ix, color);
                }
                else if (!path && this.paths[ix]) {
                    this.paths[ix]!.destroy();
                    this.paths[ix] = null;
                }
            })
            this.isRoadDrawn = this.getRoadDrawnStatus();
            this.checkColors(this.cell.schemeCell.road);
        }
        else if (this.isRoadDrawn) {
            this.destroyPaths();
        }
    }

    private drawPath(ix: number, color: number | null) : void {
        this.pathsColorsIXs[ix] = this.colorToVarConstIx(color);
        let model = new SpriteModel(TT[TT_ROAD[ix] + COLOR_TO_VAR[this.pathsColorsIXs[ix]]]);
        this.cell.model.addChild(model.model);
        if (ix == ROAD_PATH_UP || ix == ROAD_PATH_DOWN) {
            model.centeredPivot = true;
            model.model.angle = PIXI_ROTATE_LEFT
        }
        this.paths[ix] = model;
    }

    private checkColors(schemeRoad: CellRoadOfScheme) : void {
        this.pathsColorsIXs.forEach((ixOfConst: number, ixOfPaths: number) => {
            if (!this.paths[ixOfPaths]) {
                return;
            }
            let path: CellPath = schemeRoad.paths[ixOfPaths];
            let color: number | null = 'boolean' != typeof path ? path.color : null;
            let ixOfConstNew = this.colorToVarConstIx(color);
            if (this.pathsColorsIXs[ixOfPaths] != ixOfConstNew) {
                this.pathsColorsIXs[ixOfPaths] = ixOfConstNew;
                this.paths[ixOfPaths]!.changeTexture(TT[TT_ROAD[ixOfPaths] + COLOR_TO_VAR[this.pathsColorsIXs[ixOfPaths]]]);
            }
        });
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

    private colorToVarConstIx(color: ContentColor) : number {
        if (!color) { return 0; }
        return CONF.COLOR_TO_STONE_TYPE[color];
    }
}