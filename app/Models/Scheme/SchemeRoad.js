const ROAD_LIGHT = 1;
const ROAD_HEAVY = 2;
const ROAD_LEFT_RIGHT = 3;
const ROAD_UP_DOWN = 4;
const ROAD_COMMON_ROTATE = { [ROAD_LEFT_RIGHT]: null, [ROAD_UP_DOWN]: PIXI_ROTATE_90, [ROAD_HEAVY]: null, [ROAD_LIGHT]: null };

const ROAD_PATH_UP = 0;
const ROAD_PATH_RIGHT = 1;
const ROAD_PATH_DOWN = 2;
const ROAD_PATH_LEFT = 3;
const ROAD_PATH_HEAVY = 4;

const SIDE_TO_ROAD_PATH = {
    [UP]: ROAD_PATH_UP,
    [RIGHT]: ROAD_PATH_RIGHT,
    [DOWN]: ROAD_PATH_DOWN,
    [LEFT]: ROAD_PATH_LEFT,
};
const ROAD_PATH_TO_SIDE = {
    [ROAD_PATH_UP]: UP,
    [ROAD_PATH_RIGHT]: RIGHT,
    [ROAD_PATH_DOWN]: DOWN,
    [ROAD_PATH_LEFT]: LEFT,
};
const ALL_PATHS_ARE = [true, true, true, true, false];

const TT_ROAD = {
    [ROAD_PATH_UP]: TT.roadR,
    [ROAD_PATH_RIGHT]: TT.roadR,
    [ROAD_PATH_DOWN]: TT.roadL,
    [ROAD_PATH_LEFT]: TT.roadL,
    [ROAD_PATH_HEAVY]: TT.roadH,
}

const ROTATE_ROAD = {
    [ROAD_PATH_UP]: PIXI_ROTATE_270,
    [ROAD_PATH_DOWN]: PIXI_ROTATE_270,
}

class SchemeRoad extends Sprite {

    cell;
    paths = [null, null, null, null, null];

    constructor(config) {
        super(config);
        this.cell = config.cell;
        this.refreshPaths();
    }

    get type() { return this.cell.typeOfRoad; }
    set type(val) { this.scheme.findCellOrEmpty(...this.cell.schemePosition).road.type = val; }
    get schemePaths() { return this.scheme.findCellOrEmpty(...this.cell.schemePosition).road.paths; }

    drawPath(pathType, color = null) {
        if (!this.paths[pathType]) {
            this.paths[pathType] = Factory.sceneModel({
                model: Sprite,
                name: this.name + '|path' + pathType,
                texture: {
                    path: TT_ROAD[pathType],
                    parentModel: this.cell,
                    rotate: ROTATE_ROAD.hasOwnProperty(pathType) ? ROTATE_ROAD[pathType] : null,
                },
            });
            Scene.addModelToContainer(this.paths[pathType], this);

            this.paths[pathType].colorizer = new Colorizer(this.paths[pathType]);
        }

        this.paths[pathType].colorizer.setColor(color);
    }

    removePath(pathType) {
        this.destroyChild('paths', pathType);
    }

    refreshPaths() {
        this.schemePaths.map((schemePath, pathType) => {
            if (schemePath) {
                let color = true === schemePath ? null : schemePath.color;
                this.drawPath(pathType, color);
            }
            else {
                this.removePath(pathType);
            }
        });
    }

    get scheme() { return this.cell.grid.scheme; }

    get countObjectsAround() { return this.scheme.countObjectsAround(...this.cell.schemePosition); }
}