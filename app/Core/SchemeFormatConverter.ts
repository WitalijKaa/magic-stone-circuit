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
import {SIDES} from "../config/game";
import {Size} from "./Size";
import {ICellWithGen} from "./Interfaces/ICellWithGen";

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
                else if ('gen' in schemeCell && schemeCell.gen) {
                    schemeCopy[rr][cc] = { g: { s: CONF.COLOR_TO_STONE_TYPE[schemeCell.gen.start], p: schemeCell.gen.phases.map(color => CONF.COLOR_TO_STONE_TYPE[color]) } };
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
        if ('g' in schemeCell) {
            SchemeBase.initCellAsGenByCopy(model, schemeCell.g, false);
            return model as ICellWithGen;
        }
        return null;
    }

    public static turnRight(scheme: SchemeCopy) : SchemeCopy {
        let schemeTurned: SchemeCopy = {};
        let size = SchemeFormatConverter.findSize(scheme);

        for (let fromX = 0; fromX <= size.width; fromX++) {
            for (let fromY = size.height; fromY >= 0; fromY--) {
                if (!scheme[fromX]) { continue; }
                let fromCell = scheme[fromX][fromY];
                if (!fromCell) { continue; }

                let toX = size.height - fromY + 1;
                let toY = fromX;
                if (!schemeTurned[toX]) { schemeTurned[toX] = {}; }

                if ('r' in fromCell) {
                    let paths = [...CONF.ALL_PATHS_EMPTY] as RoadSavePathsArray;
                    fromCell.r.p.split('').forEach((ix) => {
                        paths[+ix] = true;
                    })
                    let pathsTurnedRight = [...CONF.ALL_PATHS_EMPTY] as RoadSavePathsArray;
                    SIDES.forEach((side) => {
                        if (paths[CONF.SIDE_TO_ROAD_PATH[side]]) { pathsTurnedRight[CONF.SIDE_TO_ROAD_PATH[CONF.SIDES_TURN_BY_CLOCK[side]]] = true; }
                    })
                    if (paths[CONF.ROAD_PATH_HEAVY]) { pathsTurnedRight[CONF.ROAD_PATH_HEAVY] = true; }

                    schemeTurned[toX][toY] = { r: {
                        t: fromCell.r.t,
                        p: pathsTurnedRight.map((path, ix) => { return path ? ix : ''; }).join(''),
                    }};
                }
                else if ('s' in fromCell) {
                    schemeTurned[toX][toY] = { s: {
                        t: fromCell.s.t,
                        d: fromCell.s.d == CONF.ROAD_HEAVY ? CONF.ROAD_HEAVY : (
                                fromCell.s.d == CONF.ROAD_LEFT_RIGHT ? CONF.ROAD_UP_DOWN : CONF.ROAD_LEFT_RIGHT
                            ),
                    }};
                }
                else if ('c' in fromCell) {
                    schemeTurned[toX][toY] = { c: { t: fromCell.c.t, }};
                }
                else if ('t' in fromCell) {
                    schemeTurned[toX][toY] = { t: 1 };
                }
                else if ('f' in fromCell) {
                    schemeTurned[toX][toY] = { f: {
                        t: CONF.SIDES_TURN_BY_CLOCK[fromCell.f.t],
                    }};
                }
                else if ('g' in fromCell) {
                    schemeTurned[toX][toY] = { g: { s: fromCell.g.s, p: [...fromCell.g.p] } };
                }
            }
        }

        return schemeTurned;
    }

    public static findSize(scheme: SchemeCopy) : Size {
        let maxX = 0, maxY = 0;

        for (let row in scheme) {
            if (+row > maxX) { maxX = +row; }
            for (let column in scheme[row]) {
                if (+column > maxY) { maxY = +column; }
            }
        }
        return { width: maxX, height: maxY };
    }
}