import * as CONF from "../../config/game";
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../../config/game";
import {AbstractComponent} from "./AbstractComponent";
import {LEVELS} from "../../config/levels";
import {SemiColor} from "../Types/CellSemiconductor";
import {IPoss} from "../IPoss";

export class LevelComponent extends AbstractComponent {

    public isLevelMode: boolean = false;
    private levelCode: string = '';
    private levelModeCheck: boolean = false;

    public get inputAllowed() : boolean {
        return false == this.levelModeCheck;
    }

    public levelMode(code: string) : void {
        this.levelCode = code;
        this.scheme.resetScheme();
        this.scheme.loadScheme(JSON.parse(LEVELS[code].json));
        this.scheme.setSaveToStorageMethod(() => {})
        this.isLevelMode = true;
    }

    public async checkLevel() {
        if (this.isLevelMode && !this.isRoadBuildMode) {
            this.levelModeCheck = true;
        }
        if (this.levelModeCheck) {
            this['check_' + this.levelCode]()
                .then(() => {
                    alert('YES!!!! You win!');
                })
                .catch(() => {
                    alert('Sorry, you loose :(');
                })
                .finally(() => {
                    this.levelModeCheck = false;
                });
            return;
        }
        alert('Stop to build road first...');
    }

    private async check_l1() : Promise<boolean> {
        return this.isSmileColored(800000023, 800000009);
    }

    private async check_l2() : Promise<boolean> {
        return this.isSmileColored(800000023, 800000009);
    }

    private async check_l3() : Promise<Array<boolean>> {
        return Promise.all([
            this.isSmileColored(800000024, 800000005),
            this.isSmileColored(800000023, 800000009),
            this.isSmileColored(800000024, 800000013),
            this.isSmileColored(800000027, 800000014),
        ]);
    }

    private async check_l4() : Promise<boolean> {
        return this.logicWithTwoColors(null, CONF.COLOR_VIOLET_ROAD);
    }
    private async check_l5() : Promise<boolean> {
        return this.logicWithTwoColors(CONF.COLOR_VIOLET_ROAD, CONF.COLOR_RED_ROAD);
    }

    private async logicWithTwoColors(colorA: SemiColor, colorB: SemiColor) : Promise<boolean> {
        let switcher = this.findCell({x: 800000012, y: 800000009});
        let smile = this.findCell({x: 800000023, y: 800000009});

        if (!switcher || !switcher.content || !switcher.content.range.length ||
            !smile || !smile.smile) {
            return Promise.reject();
        }

        this.scheme.anyClick(switcher.poss);
        if (switcher.content.type != CONF.ST_STONE_VIOLET) {
            this.scheme.anyClick(switcher.poss);
        }

        let smileColor = this.colorAwaiter(smile.poss);
        this.scheme.anyClick(switcher.poss);

        let color = await smileColor;
        if (colorA != color) {
            return Promise.reject();
        }

        await this.littlePause();

        this.scheme.anyClick(switcher.poss);
        this.scheme.anyClick(switcher.poss);
        smileColor = this.colorAwaiter(smile.poss);
        this.scheme.anyClick(switcher.poss);

        color = await smileColor;
        if (colorB == color) {
            return Promise.resolve(true);
        }
        else {
            return Promise.reject();
        }
    }

    private async isSmileColored(x: number, y: number) : Promise<boolean> {
        let cell = this.findCell({x: x, y: y});
        return !!cell?.smile?.color;
    }

    private async littlePause() : Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => { resolve(); }, 500)
        });
    }

    private async colorAwaiter(poss: IPoss) : Promise<SemiColor> {
        let cell = this.findCell(poss);
        if (!cell?.smile) { return null; }
        return new Promise((resolve) => {
            let schemeLock = false;

            cell!.smile!.event = (color: SemiColor) => {
                schemeLock = true;
                cell!.smile!.event = null;
                setTimeout(() => { resolve(color); }, CONF.NANO_MS);
            };

            this.scheme.addRoadColoringFinalHandler(() => {
                if (!schemeLock) {
                    cell!.smile!.event = null;
                    resolve(null);
                }
            })
        })
    }
}