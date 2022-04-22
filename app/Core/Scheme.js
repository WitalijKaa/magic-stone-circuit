class Scheme {

    static schemes = {};

    static getNamedScheme(name) {
        if (!Scheme.schemes[name]) {
            Scheme.schemes[name] = new Scheme();
        }
        return Scheme.schemes[name];
    }

    scheme;

    constructor() {
        this.scheme = [];
    }

    get ratio() {
        return devicePixelRatio;
    }
}