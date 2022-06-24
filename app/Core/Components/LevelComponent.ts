import * as CONF from "../../config/game";
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../../config/game";
import {AbstractComponent} from "./AbstractComponent";
import {LEVELS} from "../../config/levels";
import {SemiColor} from "../Types/CellSemiconductor";

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
        let switcher = this.findCell({x: 800000012, y: 800000009});
        let smile = this.findCell({x: 800000023, y: 800000009});

        if (!switcher || !switcher.content || !switcher.content.range.length ||
            !smile || !smile.smile) {
            return false;
        }


        return Promise.reject();
    }
    private async check_l5() : Promise<boolean> {
        return Promise.reject();
    }

    private async isSmileColored(x: number, y: number) : Promise<boolean> {
        let cell = this.findCell({x: x, y: y});
        return !!cell?.smile?.color;
    }
}