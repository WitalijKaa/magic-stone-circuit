import {Scheme} from './Scheme'
import {ICellWithContent} from "./Interfaces/ICellWithContent";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {SchemeCopy} from "./Types/SchemeCopy";

export class SchemeStorage {

    private schemes: {[key: string]: Scheme} = {};

    public getNamedScheme(name: string) : Scheme {
        if (!this.schemes[name]) {
            this.schemes[name] = new Scheme(name);
        }
        return this.schemes[name];
    }

    public save(name: string) : void {
        let scheme = this.getNamedScheme(name).scheme as { [keyX: number]: { [keyY: number]: null | ICellWithContent | ICellWithRoad | ICellWithSemiconductor } };
        let schemeCopy: SchemeCopy = {};

        for (let row in scheme) {
            for (let column in scheme[row]) {
                let schemeCell = scheme[row][column];
                if (!schemeCell) { continue; }
                if (!schemeCopy[row]) { schemeCopy[row] = {}; }

                if ('road' in schemeCell && schemeCell.road) {
                    schemeCopy[row][column] = { road: { type: schemeCell.road.type, paths: schemeCell.road.paths.map((path) => { return !!path; }) }}
                }
                else if ('semiconductor' in schemeCell && schemeCell.semiconductor) {
                    schemeCopy[row][column] = { semiconductor: { type: schemeCell.semiconductor.type, direction: schemeCell.semiconductor.direction }}
                }
                else if ('content' in schemeCell && schemeCell.content) {
                    schemeCopy[row][column] = { content: schemeCell.content };
                }
            }
        }

        this.saveToDisk('__schema11__' + name, schemeCopy)
    }

    public load(name: string) : SchemeCopy {
        return this.getFromDisk('__schema11__' + name);
    }

    private saveToDisk(key: string, value: SchemeCopy) : void {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    private getFromDisk(key: string) : SchemeCopy {
        let item = window.localStorage.getItem(key);
        if (!item) { return {}; }
        return JSON.parse(item) as SchemeCopy;
    }
}