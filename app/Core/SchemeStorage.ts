import {ICellWithContent} from "./Interfaces/ICellWithContent";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {SchemeCopy, SchemeStructure} from "./Types/Scheme";
import {DEFAULT_SCHEME_NAME} from "../config/game";
import {RoadSavePathsArray} from "./Types/CellRoad";
import {ICellWithSmile} from "./Interfaces/ICellWithSmile";
import {preSchemes} from "../config/levels";

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
        let scheme = this.getNamedScheme(name) as { [keyX: number]: { [keyY: number]: null | ICellWithContent | ICellWithRoad | ICellWithSemiconductor | ICellWithSmile } };
        let schemeCopy: SchemeCopy = {};

        for (let row in scheme) {
            for (let column in scheme[row]) {
                let schemeCell = scheme[row][column];
                if (!schemeCell) { continue; }

                let rr = +row - 800000000 + 100;
                let cc = +column - 800000000 + 100;
                if (!schemeCopy[rr]) { schemeCopy[rr] = {}; }

                if ('road' in schemeCell && schemeCell.road) {
                    schemeCopy[rr][cc] = { r:
                            {
                                t: schemeCell.road.type,
                                p: schemeCell.road.paths.map((path, ix) => { return path ? ix : ''; }).join(''),
                            }
                    };
                }
                else if ('semiconductor' in schemeCell && schemeCell.semiconductor) {
                    schemeCopy[rr][cc] = { s: { t: schemeCell.semiconductor.type, d: schemeCell.semiconductor.direction }}
                }
                else if ('content' in schemeCell && schemeCell.content) {
                    schemeCopy[rr][cc] = { c: { t: schemeCell.content.type } };
                    if (schemeCell.content.range && schemeCell.content.range.length) {
                        schemeCopy[rr][cc] = { c: { t: schemeCell.content.type, r: schemeCell.content.range } };
                    }
                }
                else if ('smile' in schemeCell && schemeCell.smile.view) {
                    schemeCopy[rr][cc] = { i: { l: schemeCell.smile.logic } };
                }
            }
        }

        this.saveToDisk('__schema__' + name, schemeCopy)
    }

    public saveCallback(name: string = DEFAULT_SCHEME_NAME) : () => void {
        return this.save.bind(this, name);
    }

    public load(scheme: SchemeStructure, name: string = DEFAULT_SCHEME_NAME) : SchemeCopy {
        this.schemes[name] = scheme;
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

    public getSchemesNames() : Array<string> {
        let names: Array<string> = [];
        for (let name in window.localStorage) {
            if ('__schema__' == name.substr(0, 10)) {
                if (DEFAULT_SCHEME_NAME == name.substr(10)) { continue; }
                names.push(name.substr(10));
            }
        }
        return names.sort();
    }

    public initPreSchemes() {
        if (null === window.localStorage.getItem('__preload__1__')) {
            for (let schemeName in preSchemes) {
                if (null === window.localStorage.getItem('__schema__' + schemeName)) {
                    window.localStorage.setItem('__schema__' + schemeName, preSchemes[schemeName]);
                }
            }
        }
        window.localStorage.setItem('__schema__' + DEFAULT_SCHEME_NAME, preSchemes[DEFAULT_SCHEME_NAME]);
        window.localStorage.setItem('__preload__1__', '1');
    }
}