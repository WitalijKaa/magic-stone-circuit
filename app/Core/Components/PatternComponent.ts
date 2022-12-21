import {IPoss} from "../IPoss";
import {AbstractComponent} from "./AbstractComponent";
import {SchemeCellStructure, SchemeCopy, SchemeCopyCell, SchemeStructure} from "../Types/Scheme";
import {SchemeFormatConverter} from "../SchemeFormatConverter";
import {Size} from "../Size";

export class PatternComponent extends AbstractComponent {

    private mode: boolean = false;
    private isBorderVisible: boolean = false;
    private start!: IPoss;
    private end!: IPoss;

    private prevVisibility: boolean = false;
    private prevPoss!: IPoss;

    private ghostPatternAngle: number = 0;
    private ghostPatternOrigin: { [key: string]: SchemeCopy } = {};
    private ghostPatternSize: { [key: string]: Size } = {};
    private ghostStartOrigin: IPoss | null = null;
    private ghostPivot: number = 1; // 1 left-up corner, 2 right-up, 3 center, 4 left-down, 5 right-down

    private get ghostPattern() : SchemeCopy | null {
        if (!this.ghostPatternOrigin[this.ghostPatternAngle]) {
            return null;
        }
        return this.ghostPatternOrigin[this.ghostPatternAngle];
    }

    private get ghostStart() : IPoss | null {
        if (!this.ghostStartOrigin) { return null; }
        switch (this.ghostPivot) {
            case 1: return { x: this.ghostStartOrigin.x - 1, y: this.ghostStartOrigin.y - 1 };
            case 2: return { x: this.ghostStartOrigin.x - this.ghostPatternSize[this.ghostPatternAngle].width, y: this.ghostStartOrigin.y - 1 };
            case 3: return { x: this.ghostStartOrigin.x - Math.floor(this.ghostPatternSize[this.ghostPatternAngle].width / 2), y: this.ghostStartOrigin.y - Math.floor(this.ghostPatternSize[this.ghostPatternAngle].height / 2) };
            case 4: return { x: this.ghostStartOrigin.x - 1, y: this.ghostStartOrigin.y - this.ghostPatternSize[this.ghostPatternAngle].height };
            case 5: return { x: this.ghostStartOrigin.x - this.ghostPatternSize[this.ghostPatternAngle].width, y: this.ghostStartOrigin.y - this.ghostPatternSize[this.ghostPatternAngle].height };
        }
        return null;
    }

    public set patternLoaded(pattern: SchemeCopy) {
        this.ghostPatternOrigin[0] = pattern;
        this.ghostPatternSize[0] = SchemeFormatConverter.findSize(pattern);
        this.ghostStartOrigin = null;
    }

    public turnByClock() : void {
        let prevAngle = this.ghostPatternAngle;
        this.ghostPatternAngle += 90;
        if (this.ghostPatternAngle > 270) { this.ghostPatternAngle = 0; }

        if (!this.ghostPatternOrigin[this.ghostPatternAngle]) {
            this.ghostPatternOrigin[this.ghostPatternAngle] = SchemeFormatConverter.turnRight(this.ghostPatternOrigin[prevAngle]);
            this.ghostPatternSize[this.ghostPatternAngle] = SchemeFormatConverter.findSize(this.ghostPatternOrigin[this.ghostPatternAngle]);
        }
        this.refreshVisibleAll();
    }

    public turnAntiClock() : void {
        this.ghostPatternAngle -= 90;
        if (this.ghostPatternAngle < 0) { this.ghostPatternAngle = 270; }

        if (!this.ghostPatternOrigin[this.ghostPatternAngle]) {
            if (!this.ghostPatternOrigin[90]) {
                this.ghostPatternOrigin[90] = SchemeFormatConverter.turnRight(this.ghostPatternOrigin[0]);
                this.ghostPatternSize[90] = SchemeFormatConverter.findSize(this.ghostPatternOrigin[90]);
            }
            if (!this.ghostPatternOrigin[180]) {
                this.ghostPatternOrigin[180] = SchemeFormatConverter.turnRight(this.ghostPatternOrigin[90]);
                this.ghostPatternSize[180] = SchemeFormatConverter.findSize(this.ghostPatternOrigin[180]);
            }
            if (!this.ghostPatternOrigin[270]) {
                this.ghostPatternOrigin[270] = SchemeFormatConverter.turnRight(this.ghostPatternOrigin[180]);
                this.ghostPatternSize[270] = SchemeFormatConverter.findSize(this.ghostPatternOrigin[270]);
            }
        }
        this.refreshVisibleAll();
    }

    public switchPivot() : void {
        this.ghostPivot++;
        if (this.ghostPivot > 5) { this.ghostPivot = 1; }

        this.refreshVisibleAll();
    }

    public get isActionCreateOn() : boolean { return this.mode; }
    public get isActionPutOn() : boolean { return !!this.ghostPattern; }

    public showGhosts(poss: IPoss) : boolean {
        if (!this.ghostPattern) { return false; }
        if (!this.ghostStartOrigin || (this.ghostStartOrigin.x != poss.x || this.ghostStartOrigin.y != poss.y)) {
            this.ghostStartOrigin = { x: poss.x, y: poss.y };
            this.refreshVisibleAll();
        }
        return true;
    }

    public hideGhosts() : void {
        if (!this.ghostPattern) { return; }
        this.ghostPatternOrigin = {};
        this.ghostPatternSize = {};
        this.ghostPatternAngle = 0;
        this.refreshVisibleAll();
    }

    public cellBorderType(poss: IPoss) : null | boolean { // false -> corner, true -> line
        if (!this.mode || !this.isBorderVisible) { return null; }

        if (this.possEquals(poss, this.start) || this.possEquals(poss, this.end) || this.possEquals(poss, this.cornerA) || this.possEquals(poss, this.cornerB)) {
            return false;
        }
        if ((poss.x == this.start.x || poss.x == this.end.x) && this.belongsToLine(poss.y, this.start.y, this.end.y)) {
            return true;
        }
        if ((poss.y == this.start.y || poss.y == this.end.y) && this.belongsToLine(poss.x, this.start.x, this.end.x)) {
            return true;
        }
        return null;
    }

    public findGhost(poss: IPoss) : null | SchemeCopyCell {
        if (!this.ghostPattern || !this.ghostStart) { return null; }
        let x = poss.x - this.ghostStart.x;
        let y = poss.y - this.ghostStart.y;
        if (this.ghostPattern[x] && this.ghostPattern[x][y]) {
            return this.ghostPattern[x][y];
        }
        return null;
    }

    public create(poss: IPoss) : void {
        if (!this.mode) {
            if (!this.findCell(poss)) {
                this.end = this.start = { x: poss.x, y: poss.y };
                this.mode = true;
                this.isBorderVisible = true;
                this.prevVisibility = false;
                this.refreshBordersVisibility();
            }
        }
        else {
            this.prevPoss = this.end;
            this.end = { x: poss.x, y: poss.y };
            this.mode = false;
            if (this.isBorderVisible) {
                this.prevVisibility = true;
                this.isBorderVisible = false;
                this.refreshBordersVisibility();
            }
            if (!this.findCell(poss) && this.start.x != this.end.x && this.start.y != this.end.y && this.checkIfBordersVisible()) {
                this.save();
            }
        }
    }

    public update(poss: IPoss) : void {
        if (!this.mode || this.end.x == poss.x && this.end.y == poss.y) {
            return;
        }
        this.prevPoss = this.end;
        this.end = { x: poss.x, y: poss.y };
        this.isBorderVisible = this.checkIfBordersVisible();
        this.refreshBordersVisibility();
    }

    private checkIfBordersVisible() : boolean {
        if (this.findCell(this.end)) { return false; }
        if (this.possEquals(this.start, this.end)) { return true; }
        if (this.findCell(this.cornerA) || this.findCell(this.cornerB)) { return false; }

        if (this.start.x != this.end.x) {
            let step = this.end.x > this.start.x ? 1 : -1;
            for (let x = this.start.x + step; Math.abs(x) != Math.abs(this.end.x); x += step) {
                let cell = this.findCell({x: x, y: this.start.y});
                if (cell && !cell.isSpeedToUpOrDown) { return false; }
                cell = this.findCell({x: x, y: this.end.y});
                if (cell && !cell.isSpeedToUpOrDown) { return false; }
            }
        }
        if (this.start.y != this.end.y) {
            let step = this.end.y > this.start.y ? 1 : -1;
            for (let y = this.start.y + step; Math.abs(y) != Math.abs(this.end.y); y += step) {
                let cell = this.findCell({x: this.start.x, y: y});
                if (cell && !cell.isSpeedToLeftOrRight) { return false; }
                cell = this.findCell({x: this.end.x, y: y});
                if (cell && !cell.isSpeedToLeftOrRight) { return false; }
            }
        }
        return true;
    }

    private refreshBordersVisibility() : void {
        if (this.prevVisibility != this.isBorderVisible) {
            if (this.isBorderVisible) { this.refreshCurrentBorderVisibility(); }
            else { this.refreshPreviousBorderVisibility(); }
        }
        else if (this.isBorderVisible && this.possNotEquals(this.prevPoss, this.end)) {
            this.refreshPreviousBorderVisibility();
            this.refreshCurrentBorderVisibility();
        }
        this.prevVisibility = this.isBorderVisible
    }

    private refreshCurrentBorderVisibility() : void {
        this.refreshVisibleCell(this.cornerB);

        if (this.start.x != this.end.x) {
            let step = this.end.x > this.start.x ? 1 : -1;
            for (let x = this.start.x; Math.abs(x) != Math.abs(this.end.x); x += step) {
                let poss = {x: x, y: this.start.y};
                this.refreshVisibleCell(poss);
                poss = {x: x, y: this.end.y};
                this.refreshVisibleCell(poss);
            }
        }
        if (this.start.y != this.end.y) {
            let step = this.end.y > this.start.y ? -1 : 1;
            for (let y = this.end.y; Math.abs(y) != Math.abs(this.start.y); y += step) {
                let poss = { x: this.start.x, y: y };
                this.refreshVisibleCell(poss);
                poss = { x: this.end.x, y: y };
                this.refreshVisibleCell(poss);
            }
        }
    }

    private refreshPreviousBorderVisibility() : void {
        if (null === this.cellBorderType(this.start)) { this.refreshVisibleCell(this.start); }
        if (null === this.cellBorderType(this.prevPoss)) { this.refreshVisibleCell(this.prevPoss); }
        if (null === this.cellBorderType({ x: this.prevPoss.x, y: this.start.y })) { this.refreshVisibleCell({ x: this.prevPoss.x, y: this.start.y }); }
        if (null === this.cellBorderType({ x: this.start.x, y: this.prevPoss.y })) { this.refreshVisibleCell({ x: this.start.x, y: this.prevPoss.y }); }

        if (this.start.x != this.prevPoss.x) {
            let step = this.prevPoss.x > this.start.x ? 1 : -1;
            for (let x = this.start.x + step; Math.abs(x) != Math.abs(this.prevPoss.x); x += step) {
                let poss = { x: x, y: this.start.y };
                if (null === this.cellBorderType(poss)) { this.refreshVisibleCell(poss); }
                poss = { x: x, y: this.prevPoss.y };
                if (null === this.cellBorderType(poss)) { this.refreshVisibleCell(poss); }
            }
        }
        if (this.start.y != this.prevPoss.y) {
            let step = this.prevPoss.y > this.start.y ? 1 : -1;
            for (let y = this.start.y + step; Math.abs(y) != Math.abs(this.prevPoss.y); y += step) {
                let poss = { x: this.start.x, y: y };
                if (null === this.cellBorderType(poss)) { this.refreshVisibleCell(poss); }
                poss = { x: this.prevPoss.x, y: y };
                if (null === this.cellBorderType(poss)) { this.refreshVisibleCell(poss); }
            }
        }
    }

    private save() : void {
        let name = prompt('Enter pattern name please.');
        if (!name || !name.trim()) { return; }
        let pattern: SchemeStructure = {};
        let startX = this.start.x < this.end.x ? this.start.x : this.end.x;
        let startY = this.start.y < this.end.y ? this.start.y : this.end.y;
        let endX = this.start.x > this.end.x ? this.start.x : this.end.x;
        let endY = this.start.y > this.end.y ? this.start.y : this.end.y;

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                let cell = this.findCell({x: x, y: y}) as SchemeCellStructure;
                if (cell) {
                    let px = x - startX;
                    let py = y - startY;
                    if (!pattern[px]) { pattern[px] = {}; }
                    pattern[px][py] = cell;
                }
            }
        }
        let copy = SchemeFormatConverter.toShortFormat(pattern, false);
        this.scheme.savePattern(name, copy);
    }

    public put() : void {
        if (!this.ghostPattern) { return; }
        this.loadScheme(this.ghostPattern, this.ghostStart!);
        this.hideGhosts();
    }

    public cancelCreate() : void {
        this.mode = false;
        this.prevVisibility = false;
        this.refreshBordersVisibility();
    }

    private get cornerA() : IPoss { return { x: this.start.x, y: this.end.y } }
    private get cornerB() : IPoss { return { x: this.end.x, y: this.start.y } }
}