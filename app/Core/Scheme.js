const ST_STONE_VIOLET = 1;
const ST_STONE_RED = 2;
const ST_STONE_INDIGO = 3;
const ST_STONE_ORANGE = 4;
const ST_ENERGY = 5;
const ST_TRANS = 6;
const ST_TRANS_SLEEP = 7;
const ST_TRANS_AWAKE = 8;

const TT_SCHEME = {
    [ST_STONE_VIOLET]: TT.stoneV,
    [ST_STONE_RED]: TT.stoneR,
    [ST_STONE_INDIGO]: TT.stoneI,
    [ST_STONE_ORANGE]: TT.stoneO,
    [ST_ENERGY]: TT.energy,
}

const STONE_TYPE_TO_ROAD_COLOR = {
    [ST_STONE_VIOLET]: COLOR_VIOLET_ROAD,
    [ST_STONE_RED]: COLOR_RED_ROAD,
    [ST_STONE_INDIGO]: COLOR_INDIGO_ROAD,
    [ST_STONE_ORANGE]: COLOR_ORANGE_ROAD,
}

class Scheme {

    static SIZE_RADIUS = 800000000;

    static schemes = {};

    static getNamedScheme(name) {
        if (!Scheme.schemes[name]) {
            Scheme.schemes[name] = new Scheme();
        }
        return Scheme.schemes[name];
    }

    scheme = {};

    get ratio() {
        return Scene.deviceRation;
    }

    createCell(x, y) {
        if (!this.scheme[x]) { this.scheme[x] = {}; }
        this.scheme[x][y] = { };
        return this.scheme[x][y];
    }

    changeCellContent(type, x, y) {
        if (type) {
            let cell = this.createCell(x, y);
            cell.content = type;
        }
        else { this.deleteCellContent(x, y); }
    }
    changeCellRoad(type, x, y) {
        if (type) {
            let cell = this.createCell(x, y);
            cell.road = type;
        }
        else { this.deleteCellRoad(x, y); }
    }

    deleteCell(x, y) {
        if (!this.scheme[x]) { return; }
        this.scheme[x][y] = null;
    }
    deleteCellContent(x, y) {
        if (this.scheme[x] && this.scheme[x][y]) {
            this.scheme[x][y].content = null;
            this.isCellEmpty(x, y);
        }
    }
    deleteCellRoad(x, y) {
        if (this.scheme[x] && this.scheme[x][y]) {
            this.scheme[x][y].road = null;
            this.isCellEmpty(x, y);
        }
    }

    getCell(x, y) {
        if (this.scheme[x] && this.scheme[x][y]) { return this.scheme[x][y]; }
        return {};
    }

    isCellEmpty (x, y) {
        if (!this.scheme[x] || !this.scheme[x][y]) {
            return true;
        }
        if (!this.scheme[x][y].content && !this.scheme[x][y].road) {
            this.scheme[x][y] = null;
            return true;
        }
        return false;
    }
}
