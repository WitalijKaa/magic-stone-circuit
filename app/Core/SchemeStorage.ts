class SchemeStorage {

    schemes: object;

    constructor() {
        this.schemes = {};
    }

    public getNamedScheme(name: string) : Scheme {
        if (!this.schemes[name]) {
            this.schemes[name] = new Scheme(name);
        }
        return this.schemes[name];
    }

    public save(scheme: Scheme) : void {
        // todo
    }
}