import * as CONF from "../../config/game";
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../../config/game";
import {AbstractComponent} from "./AbstractComponent";
import {LEVELS} from "../../config/levels";
import {ContentColor} from "../Types/ColorTypes";
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
        this.scheme.cancelProcesses();

        if (this.isLevelMode && !this.isRoadBuildMode) {
            this.levelModeCheck = true;
        }
        if (this.levelModeCheck) {
            this['check_' + this.levelCode]()
                .then(() => {
                    this.showMessage('YES!!!! You win! ᕦ(ò_óˇ)ᕤ');
                })
                .catch(() => {
                    this.showMessage('Sorry, you loose :(', false);
                })
                .finally(() => {
                    this.levelModeCheck = false;
                });
            return;
        }
        this.showMessage('Stop to build road first...', false);
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

    private async logicWithTwoColors(colorA: ContentColor, colorB: ContentColor) : Promise<boolean> {
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
        if (cell?.smile?.color) {
            return Promise.resolve(true);
        }
        else {
            return Promise.reject();
        }
    }

    private async littlePause() : Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => { resolve(); }, 500)
        });
    }

    private async colorAwaiter(poss: IPoss) : Promise<ContentColor> {
        let cell = this.findCell(poss);
        if (!cell?.smile) { return null; }
        return new Promise((resolve) => {
            let schemeLock = false;

            cell!.smile!.event = (color: ContentColor) => {
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

    private _msgNo = 0;

    private showMessage(text: string, isGood: boolean = true) : void {
        const $el = document.getElementById('notice');
        if (!$el) { return; }

        if ($el.classList.contains('notice--too-many')) { return; }
        this._msgNo++;

        let pause = CONF.NANO_MS;
        if ($el.classList.contains('notice--blocked')) {
            $el.classList.add('notice--too-many');
            setTimeout(() => {
                $el.classList.remove('notice--too-many');
            }, 4480);
            this.removeMessage($el, this._msgNo);
            pause = 450;
        }

        setTimeout(() => {
            $el.innerText = text;
            if (!isGood) {
                $el.classList.add('notice--error');
            }
            $el.classList.add('notice--on');
            $el.classList.add('notice--blocked');

            let no = this._msgNo;
            setTimeout(() => {
                this.removeMessage($el, no);
            }, 4000);
        }, pause);
    }

    private removeMessage($el, no) : void {
        if (no != this._msgNo) { return; }
        $el.classList.remove('notice--on');
        setTimeout(() => {
            $el.classList.remove('notice--error');
            $el.classList.remove('notice--blocked');
        }, 410);
    }
}