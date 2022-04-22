const ST_STONE_VIOLET = 1;
const ST_STONE_RED = 2;
const ST_STONE_INDIGO = 3;
const ST_STONE_ORANGE = 4;

const TT_SCHEME = {
    [ST_STONE_VIOLET]: TT.stoneV,
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

    changeCell(type, x, y) {
        if (type) {
            if (!this.scheme[x]) { this.scheme[x] = {}; }
            this.scheme[x][y] = type;
        }
        else { this.deleteCell(x, y); }
    }
    deleteCell(x, y) {
        if (!this.scheme[x]) { return; }
        this.scheme[x][y] = null;
    }

    getCell(x, y) {
        if (this.scheme[x]) { return this.scheme[x][y]; }
        return null;
    }
}
