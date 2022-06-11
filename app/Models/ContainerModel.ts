import {DisplayModel} from "./DisplayModel";
import {Container} from '@pixi/display';

export class ContainerModel extends DisplayModel {

    constructor(public container: Container) {
        super();
        this.model = container;
    }

}