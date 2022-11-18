import {IPoss} from "../IPoss";
import {AbstractComponent} from "./AbstractComponent";
import {SchemeCellStructure, SchemeCopy, SchemeCopyCell, SchemeStructure} from "../Types/Scheme";
import {SchemeFormatConverter} from "../SchemeFormatConverter";

export class PatternComponent extends AbstractComponent {

    private mode: boolean = false;
    private isBorderVisible: boolean = false;
    private start!: IPoss;
    private end!: IPoss;

    private prevVisibility: boolean = false;
    private prevPoss!: IPoss;

    private ghostPattern: SchemeCopy | null = null;
    private ghostStart: IPoss | null = null;

    public set patternLoaded(pattern: SchemeCopy) { this.ghostPattern = pattern; this.ghostStart = null;}

    public get isActionCreateOn() : boolean { return this.mode; }

    public showGhosts(poss: IPoss) : boolean {
        if (!this.ghostPattern) { return false; }
        if (!this.ghostStart) {
            this.ghostStart = { x: poss.x, y: poss.y };
        }
        else {
            if (this.ghostStart.x != poss.x || this.ghostStart.y != poss.y) {
                this.ghostStart = { x: poss.x, y: poss.y };
                this.refreshVisibleAll();
            }
        }
        return true;
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

    public put(poss: IPoss) : void {
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
                this.create();
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

    private create() : void {
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

    public cancel() : void {
        this.mode = false;
        this.prevVisibility = false;
        this.refreshBordersVisibility();
    }

    private get cornerA() : IPoss { return { x: this.start.x, y: this.end.y } }
    private get cornerB() : IPoss { return { x: this.end.x, y: this.start.y } }
}