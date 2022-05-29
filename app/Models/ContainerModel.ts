import {DisplayModel} from "./DisplayModel";
import {Container} from "pixi.js";

export class ContainerModel extends DisplayModel {

    model: Container;

    constructor(container: Container) {
        super();
        this.model = container;
    }

}