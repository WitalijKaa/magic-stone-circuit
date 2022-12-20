import {SchemeCellStructure, SchemeCopy, SchemeCopyCell, SchemeStructure} from "./Types/Scheme";
import {IPoss} from "./IPoss";
import * as CONF from "../config/game";
import {RoadSavePathsArray} from "./Types/CellRoad";
import {CellScheme} from "./CellScheme";
import {SchemeBase} from "./SchemeBase";
import {ICellWithRoad} from "./Interfaces/ICellWithRoad";
import {ICellWithSemiconductor} from "./Interfaces/ICellWithSemiconductor";
import {ICellWithStone} from "./Interfaces/ICellWithStone";
import {ICellWithTrigger} from "./Interfaces/ICellWithTrigger";
import {ICellWithSpeed} from "./Interfaces/ICellWithSpeed";

export class SchemeFormatConverter {

    public static toShortFormat(scheme: SchemeStructure, isHugeScheme: boolean = true) : SchemeCopy {
        let schemeCopy: SchemeCopy = {};

        for (let row in scheme) {
            for (let column in scheme[row]) {
                let schemeCell = scheme[row][column];
                if (!schemeCell) { continue; }

                let rr = isHugeScheme ? +row - 800000000 + 100 : +row;
                let cc = isHugeScheme ? +column - 800000000 + 100 : column;
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
                }
                else if ('switcher' in schemeCell && schemeCell.switcher) {
                    schemeCopy[rr][cc] = { h: { t: schemeCell.switcher.type, r: schemeCell.switcher.range } };
                }
                else if ('trigger' in schemeCell && schemeCell.trigger) {
                    schemeCopy[rr][cc] = { t: 1 };
                }
                else if ('speed' in schemeCell && schemeCell.speed) {
                    schemeCopy[rr][cc] = { f: { t: schemeCell.speed.to } };
                }
                else if ('smile' in schemeCell && schemeCell.smile?.view) {
                    schemeCopy[rr][cc] = { i: { l: schemeCell.smile.logic } };
                }
            }
        }

        return schemeCopy;
    }

    public static toGhostFormat(poss: IPoss, schemeCell: SchemeCopyCell) : SchemeCellStructure {
        let model = new CellScheme(poss.x, poss.y, {} as SchemeBase);
        if ('r' in schemeCell) {
            let paths = [...CONF.ALL_PATHS_EMPTY] as RoadSavePathsArray;
            schemeCell.r.p.split('').forEach((ix) => {
                paths[+ix] = true;
            })

            SchemeBase.initCellAsRoad(model, schemeCell.r.t, paths);
            return model as ICellWithRoad;
        }
        if ('s' in schemeCell) {
            SchemeBase.initCellAsSemiconductor(model, schemeCell.s.d, schemeCell.s.t);
            return model as ICellWithSemiconductor;
        }
        if ('c' in schemeCell) {
            SchemeBase.initCellAsStone(model, { type: schemeCell.c.t });
            return model as ICellWithStone;
        }
        if ('t' in schemeCell) {
            SchemeBase.initCellAsTrigger(model);
            return model as ICellWithTrigger;
        }
        if ('f' in schemeCell) {
            SchemeBase.initCellAsSpeed(model, schemeCell.f.t);
            return model as ICellWithSpeed;
        }
        return null;
    }
}