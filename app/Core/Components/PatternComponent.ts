import {IPoss} from "../IPoss";
import {AbstractComponent} from "./AbstractComponent";

export class PatternComponent extends AbstractComponent {

    private mode: boolean = false;
    private isBorderVisible: boolean = false;
    private start!: IPoss;
    private move!: IPoss;
    private end!: IPoss;

    private prevVisibility: boolean = false;
    private prevMove!: IPoss;

    public get isActionAlpha() : boolean { return this.mode; }

    public cellBorderType(poss: IPoss) : null | boolean { // false -> corner, true -> line
        if (!this.mode || !this.isBorderVisible) { return null; }

        if (this.possEquals(poss, this.start) || this.possEquals(poss, this.move) || this.possEquals(poss, this.cornerA) || this.possEquals(poss, this.cornerB)) {
            return false;
        }
        if ((poss.x == this.start.x || poss.x == this.move.x) && this.belongsToLine(poss.y, this.start.y, this.move.y)) {
            return true;
        }
        if ((poss.y == this.start.y || poss.y == this.move.y) && this.belongsToLine(poss.x, this.start.x, this.move.x)) {
            return true;
        }
        return null;
    }

    public put(poss: IPoss) : void {
        if (!this.mode) {
            if (!this.findCell(poss)) {
                this.move = this.start = { x: poss.x, y: poss.y };
                this.mode = true;
                this.isBorderVisible = true;
                this.prevVisibility = false;
                this.refreshBordersVisibility();
            }
        }
        else {
            this.end = { x: poss.x, y: poss.y };
            this.mode = false;
            this.prevVisibility = false;
            if (!this.findCell(poss)) {
                this.create();
            }
        }
    }

    public update(poss: IPoss) : void {
        if (!this.mode || this.move.x == poss.x && this.move.y == poss.y) {
            return;
        }
        this.prevMove = this.move;
        this.move = { x: poss.x, y: poss.y };
        this.checkIfBordersVisible();
        this.refreshBordersVisibility();
    }

    private checkIfBordersVisible() : void {
        this.isBorderVisible = false;

        if (this.findCell(this.move)) { // under cursor
            return;
        }
        if (this.possEquals(this.start, this.move)) {
            this.isBorderVisible = true;
            return;
        }
        if (this.findCell(this.cornerA) || this.findCell(this.cornerB)) {
            return;
        }

        if (this.start.x != this.move.x) {
            let step = this.move.x > this.start.x ? 1 : -1;
            for (let x = this.start.x + step; Math.abs(x) != Math.abs(this.move.x); x += step) {
                let cell = this.findCell({x: x, y: this.start.y});
                if (cell && !cell.isSpeedToUpOrDown) { return; }
                cell = this.findCell({x: x, y: this.move.y});
                if (cell && !cell.isSpeedToUpOrDown) { return; }
            }
        }
        if (this.start.y != this.move.y) {
            let step = this.move.y > this.start.y ? 1 : -1;
            for (let y = this.start.y + step; Math.abs(y) != Math.abs(this.move.y); y += step) {
                let cell = this.findCell({x: this.start.x, y: y});
                if (cell && !cell.isSpeedToLeftOrRight) { return; }
                cell = this.findCell({x: this.move.x, y: y});
                if (cell && !cell.isSpeedToLeftOrRight) { return; }
            }
        }

        this.isBorderVisible = true;
    }

    private refreshBordersVisibility() : void {
        if (this.prevVisibility != this.isBorderVisible) {
            if (this.isBorderVisible) {
                this.refreshCurrentBorderVisibility();
            }
            else {
                this.refreshPreviousBorderVisibility();
            }
        }
        else if (this.isBorderVisible && this.possNotEquals(this.prevMove, this.move)) {
            this.refreshPreviousBorderVisibility();
            this.refreshCurrentBorderVisibility();
        }
        this.prevVisibility = this.isBorderVisible
    }

    private refreshCurrentBorderVisibility() : void {
        this.refreshVisibleCell(this.move);
        this.refreshVisibleCell(this.cornerB);

        if (this.start.x != this.move.x) {
            let step = this.move.x > this.start.x ? 1 : -1;
            for (let x = this.start.x; Math.abs(x) != Math.abs(this.move.x); x += step) {
                let poss = {x: x, y: this.start.y};
                this.refreshVisibleCell(poss);
                poss = {x: x, y: this.move.y};
                this.refreshVisibleCell(poss);
            }
        }
        if (this.start.y != this.move.y) {
            let step = this.move.y > this.start.y ? 1 : -1;
            for (let y = this.start.y + step; Math.abs(y) != Math.abs(this.move.y); y += step) {
                let poss = { x: this.start.x, y: y };
                this.refreshVisibleCell(poss);
                poss = { x: this.move.x, y: y };
                this.refreshVisibleCell(poss);
            }
        }
    }

    private refreshPreviousBorderVisibility() : void {
        if (null === this.cellBorderType(this.prevMove)) { this.refreshVisibleCell(this.prevMove); }
        if (null === this.cellBorderType({ x: this.prevMove.x, y: this.start.y })) { this.refreshVisibleCell({ x: this.prevMove.x, y: this.start.y }); }

        if (this.start.x != this.prevMove.x) {
            let step = this.prevMove.x > this.start.x ? 1 : -1;
            for (let x = this.start.x; Math.abs(x) != Math.abs(this.prevMove.x); x += step) {
                let poss = { x: x, y: this.start.y };
                if (null === this.cellBorderType(poss)) { this.refreshVisibleCell(poss); }
                poss = { x: x, y: this.prevMove.y };
                if (null === this.cellBorderType(poss)) { this.refreshVisibleCell(poss); }
            }
        }
        if (this.start.y != this.prevMove.y) {
            let step = this.prevMove.y > this.start.y ? 1 : -1;
            for (let y = this.start.y + step; Math.abs(y) != Math.abs(this.prevMove.y); y += step) {
                let poss = { x: this.start.x, y: y };
                if (null === this.cellBorderType(poss)) { this.refreshVisibleCell(poss); }
                poss = { x: this.prevMove.x, y: y };
                if (null === this.cellBorderType(poss)) { this.refreshVisibleCell(poss); }
            }
        }
    }

    private create() : void {

    }

    public cancel() : void {
        this.mode = false;
        this.prevVisibility = false;
        this.refreshBordersVisibility();
    }

    private get cornerA() : IPoss { return { x: this.start.x, y: this.move.y } }
    private get cornerB() : IPoss { return { x: this.move.x, y: this.start.y } }
}