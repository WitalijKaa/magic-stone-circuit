import { Container, Rectangle } from 'pixi.js'
import { CellGrid } from "../Cell/CellGrid";
import {Scheme} from "../../Core/Scheme";

export class SchemeGrid {

    name: string;
    container: Container;
    scheme: Scheme;

    dragX: number;
    dragY: number;

    constructor(name: string, scheme: Scheme) {
        this.name = name;
        this.scheme = scheme;
        scheme.init(this);

        this.container = new Container();
        // @ts-ignore
        this.container.interactive = true;
        // @ts-ignore
        this.container.hitArea = new Rectangle(0, 0, 100000, 100000);

        this.dragX = this.dragY = scheme.sizeRadius;
    }

    public addCellToStage(cell: CellGrid) : void {
        this.container.addChild(cell.sprite.model);
    }

    private createVisibleGrid() {

    }
}