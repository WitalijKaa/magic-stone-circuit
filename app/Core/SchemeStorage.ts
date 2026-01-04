import {SchemeCopy, SchemeInstanceStructure, SchemeStructure} from "./Types/Scheme";
import {DEFAULT_SCHEME_NAME} from "../config/game";
import {preSchemes} from "../config/levels";
import {SchemeFormatConverter} from "./SchemeFormatConverter";

export class SchemeStorage {

    private schemes: { [key: string]: SchemeStructure } = {};

    public getNamedScheme(name: string) : SchemeStructure {
        if (!this.schemes[name]) {
            this.schemes[name] = {};
        }
        return this.schemes[name];
    }

    public resetScheme(name: string = DEFAULT_SCHEME_NAME) { this.schemes[name] = {}; }

    public save(name: string = DEFAULT_SCHEME_NAME) : void {
        this.saveToDisk('__schema__' + name, SchemeFormatConverter.toShortFormat(this.getNamedScheme(name)))
    }

    public consoleLog(name: string = DEFAULT_SCHEME_NAME) : void {
        console.log(window.localStorage.getItem('__schema__' + name))
    }

    public delete(name: string) : boolean {
        return this.removeFromDisk('__schema__' + name);
    }

    public savePattern(name: string, pattern: SchemeCopy) {
        name = name.trim();
        if (!name) { return; }
        this.saveToDisk('__pattern__' + name, pattern);
    }

    public deletePattern(name: string) : boolean {
        return this.removeFromDisk('__pattern__' + name);
    }

    public loadPattern(name: string) : SchemeCopy {
        return this.getFromDisk('__pattern__' + name);
    }

    public createSaveCallback(name: string = DEFAULT_SCHEME_NAME) : () => void {
        return this.save.bind(this, name);
    }

    public createSavePatternCallback() : (name: string, pattern: SchemeCopy) => void {
        return this.savePattern.bind(this);
    }

    public load(scheme: SchemeInstanceStructure, name: string = DEFAULT_SCHEME_NAME) : SchemeCopy {
        this.schemes[name] = scheme as SchemeStructure;
        return this.getFromDisk('__schema__' + name);
    }

    private saveToDisk(key: string, value: SchemeCopy) : void {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    private getFromDisk(key: string) : SchemeCopy {
        let item = window.localStorage.getItem(key);
        if (!item) { return {}; }
        return JSON.parse(item) as SchemeCopy;
    }

    private removeFromDisk(key: string) : boolean {
        let item = window.localStorage.getItem(key);
        if (!item) { return false; }
        window.localStorage.removeItem(key);
        return true;
    }

    public getSchemesNames() : Array<string> {
        let names = this.getNamesByKey('__schema__');
        return names.filter((name) => { return DEFAULT_SCHEME_NAME != name; })
    }

    public getPatternNames() : Array<string> {
        return this.getNamesByKey('__pattern__');
    }

    public getNamesByKey(key: string) : Array<string> {
        let names: Array<string> = [];
        let keyLength = key.length;
        for (let name in window.localStorage) {
            if (key == name.substr(0, keyLength)) {
                names.push(name.substr(keyLength));
            }
        }
        return names.sort();
    }

    /** пусть на старте в памяти будет немного моих схем */
    public initPreSchemes() {
        if (null === window.localStorage.getItem('__preload__1__')) {
            for (let schemeName in preSchemes) {
                if (null === window.localStorage.getItem('__schema__' + schemeName)) {
                    window.localStorage.setItem('__schema__' + schemeName, preSchemes[schemeName]);
                }
            }
            window.localStorage.setItem('__schema__' + DEFAULT_SCHEME_NAME, preSchemes[DEFAULT_SCHEME_NAME]);
            window.localStorage.setItem('__preload__1__', '1');
        }
    }
}