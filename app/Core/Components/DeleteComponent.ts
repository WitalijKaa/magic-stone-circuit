import {IPoss} from "../IPoss";
import {AbstractComponent} from "./AbstractComponent";
import {SchemeCellStructure} from "../Types/Scheme";

export class DeleteComponent extends AbstractComponent {

    private isBorderVisible: boolean = false;
    private start!: IPoss;
    private end!: IPoss;

    private prevVisibility: boolean = false;
    private prevPoss!: IPoss;

    public get isActionOn() : boolean { return this.isBorderVisible; }

    public createFrame(poss: IPoss) : void {
        if (!this.isBorderVisible) {
            this.end = this.start = { x: poss.x, y: poss.y };
            this.prevVisibility = false;
            this.isBorderVisible = true;
            this.refreshBordersVisibility();
        }
    }

    public updateFrame(poss: IPoss) : boolean {
        if (this.isBorderVisible) {
            this.prevPoss = this.end;
            this.end = { x: poss.x, y: poss.y };
            this.refreshBordersVisibility();
            return true;
        }
        return false;
    }

    public frameDelete() : void {
        if (!this.isBorderVisible) { return; }

        let startX = this.start.x < this.end.x ? this.start.x : this.end.x;
        let startY = this.start.y < this.end.y ? this.start.y : this.end.y;
        let endX = this.start.x > this.end.x ? this.start.x : this.end.x;
        let endY = this.start.y > this.end.y ? this.start.y : this.end.y;

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                let cell = this.findCell({x: x, y: y}) as SchemeCellStructure;
                if (cell) {
                    let poss = {x: x, y: y};
                    this.scheme.removeCell(poss);
                }
            }
        }

        this.prevVisibility = false;
        this.isBorderVisible = false;
        this.refreshVisibleAll();
    }

    public cancelFrame() : void {
        if (!this.isBorderVisible) { return; }
        this.prevVisibility = true;
        this.isBorderVisible = false;
        this.refreshBordersVisibility();
    }

    public cellBorderType(poss: IPoss) : null | boolean { // false -> corner, true -> line
        if (!this.isBorderVisible) { return null; }

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

    private get cornerA() : IPoss { return { x: this.start.x, y: this.end.y } }
    private get cornerB() : IPoss { return { x: this.end.x, y: this.start.y } }
}