import {Scheme} from './Scheme'
import {ICellWithContent} from "./Interfaces/ICellWithContent";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {SchemeCopy, SchemeStructure} from "./Types/Scheme";

export class SchemeStorage {

    private schemes: { [key: string]: SchemeStructure } = {};

    public getNamedScheme(name: string) : SchemeStructure {
        if (!this.schemes[name]) {
            this.schemes[name] = {};
        }
        return this.schemes[name];
    }

    public resetScheme(name: string) { this.schemes[name] = {}; }

    public save(name: string) : void {
        let scheme = this.getNamedScheme(name) as { [keyX: number]: { [keyY: number]: null | ICellWithContent | ICellWithRoad | ICellWithSemiconductor } };
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

        this.saveToDisk('__schema__' + name, schemeCopy)
    }

    public load(scheme: SchemeStructure, name: string) : SchemeCopy {
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
}