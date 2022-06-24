import * as CONF from "../../config/game";
import {SIDES, UP, RIGHT, DOWN, LEFT} from "../../config/game";
import {AbstractComponent} from "./AbstractComponent";
import {LEVELS} from "../../config/levels";

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

    public checkLevel() : void {
        if (this.isLevelMode && !this.isRoadBuildMode) {
            this.levelModeCheck = true;
        }
        console.log('check_' + this.levelCode, this.levelModeCheck)
        if (this.levelModeCheck) {
            if (this['check_' + this.levelCode]()) {
                alert('YES!!!! You win!');
                return;
            }
        }
        alert('Sorry, you loose :(');
    }

    private check_l1() : boolean {
        let cell = this.findCell({x: 800000023, y: 800000009});
        console.log(cell);
        if (cell && cell.smile && cell.smile.color) { return true; }
        return false;
    }

    private check_l2() : boolean {
        return false;
    }
    private check_l3() : boolean {
        return false;
    }
    private check_l4() : boolean {
        return false;
    }
    private check_l5() : boolean {
        return false;
    }
}