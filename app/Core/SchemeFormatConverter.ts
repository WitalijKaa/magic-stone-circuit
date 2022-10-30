import {SchemeCopy, SchemeStructure} from "./Types/Scheme";

export class SchemeFormatConverter {

    public static toShortFormat(scheme: SchemeStructure) : SchemeCopy {
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

        return schemeCopy;
    }

}