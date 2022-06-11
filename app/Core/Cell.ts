import {IPoss} from "./IPoss";

export class Cell implements IPoss {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    get up() : Cell { return new Cell(this.x, this.y - 1); }
    get right() : Cell { return new Cell(this.x + 1, this.y); }
    get down() : Cell { return new Cell(this.x, this.y + 1); }
    get left() : Cell { return new Cell(this.x - 1, this.y); }

    get Up() : Cell { return new Cell(this.x, this.y - 1); }
    get Right() : Cell { return new Cell(this.x + 1, this.y); }
    get Down() : Cell { return new Cell(this.x, this.y + 1); }
    get Left() : Cell { return new Cell(this.x - 1, this.y); }

    public static Up(poss: IPoss) : Cell { return new Cell(poss.x, poss.y - 1); }
    public static Right(poss: IPoss) : Cell { return new Cell(poss.x + 1, poss.y); }
    public static Down(poss: IPoss) : Cell { return new Cell(poss.x, poss.y + 1); }
    public static Left(poss: IPoss) : Cell { return new Cell(poss.x - 1, poss.y); }
}