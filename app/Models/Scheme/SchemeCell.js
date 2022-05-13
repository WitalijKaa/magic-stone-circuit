class SchemeCell extends AbstractCell {

    content = null;
    road = null;
    semiconductor = null;
    grid = null;

    Up; Right; Left; Down;

    constructor(config) {
        super(config);
        this.sprite.interactive = true;
        this.sprite.on('click', () => { this.handleClick() });
        new MouseClick(this, { [MouseClick.CLICK_RIGHT]: 'handleRightClick' });
        new MouseOver(this, { [MouseOver.MOUSE_OVER]: 'handleMouseOver' });
    }

    initNeighbors() {
        SIDES.map((dir) => {
            this[dir] = this.grid.getVisibleCell(...this.getVisiblePosition(dir));
        });
    }

    handleClick() {
        if (ST_ROAD == Scene.controls.pen) {
            if (!this.scheme.isRoadBuildMode) {
                this.scheme.startToBuildRoad(...this.schemePosition);
            }
            else {
                this.scheme.finishToBuildRoad();
            }
        }
        else if (CONTENT_SPRITES.hasOwnProperty(Scene.controls.pen)) {
            this.scheme.putContent(Scene.controls.pen, ...this.schemePosition);
        }
        else if (ST_ROAD_SLEEP == Scene.controls.pen || ST_ROAD_AWAKE == Scene.controls.pen) {
            this.scheme.putSemiconductor(Scene.controls.pen, ...this.schemePosition);
        }
        else if ('q' === Scene.controls.pen) {
            this.scheme.removeContent(...this.schemePosition);
            this.scheme.putSemiconductor(null, ...this.schemePosition);
        }
    }
    handleRightClick() { this.scheme.tapRoad(...this.schemePosition); }
    handleMouseOver() {
        this.scheme.devCell(...this.schemePosition);
    }

    changeVisibleType() {
        if (this.type) {
            if (!this.content) {
                this.content = Factory.sceneModel({
                    model: Sprite,
                    name: this.name + '|content',
                    texture: {
                        path: CONTENT_SPRITES[this.type],
                        parentModel: this,
                    },
                });
                Scene.addModelToContainer(this.content, this);
            }
            else {
                this.content.changeTexture(CONTENT_SPRITES[this.type], this);
            }
        }
        else { this.destroyChild('content'); }
    }
    
    changeVisibleRoad() {
        if (this.typeOfRoad && !this.road) {
            this.road = Factory.sceneModel({
                model: SchemeRoad,
                name: this.name + '|road',
                cell: this,
            });
            Scene.addModelToContainer(this.road, this);
        }
        else if (!this.typeOfRoad) {
            this.destroyChild('road');
        }
    }
    refreshVisibleRoad() { this.road && this.road.refreshPaths(); }

    changeVisibleSemiconductor() {
        if (this.typeOfSemiconductor) {
            if (!this.semiconductor) {
                this.semiconductor = Factory.sceneModel({
                    model: SchemeSemiconductor,
                    name: this.name + '|semiconductor',
                    cell: this,
                });
                Scene.addModelToContainer(this.semiconductor, this);
            }
            else {
                this.semiconductor.refreshTexture();
            }
        }
        else if (!this.typeOfSemiconductor) {
            if (this.semiconductor) {
                this.semiconductor.destroyChild('flow');
                this.semiconductor.destroyChild('charge');
            }
            this.destroyChild('semiconductor');
        }
    }

    refreshVisibleAll() {
        this.changeVisibleType();
        this.changeVisibleRoad();
        this.refreshVisibleRoad();
        this.changeVisibleSemiconductor();
    }

    getVisiblePosition(dir) { return this['visiblePosition' + dir]; }
    get visiblePosition() { return [this.gridX + SchemeGrid.GRID_OFFSET, this.gridY + SchemeGrid.GRID_OFFSET]; }
    get visiblePositionLeft() { let poss = this.visiblePosition; poss[0]--; return poss }
    get visiblePositionRight() { let poss = this.visiblePosition; poss[0]++; return poss }
    get visiblePositionUp() { let poss = this.visiblePosition; poss[1]--; return poss }
    get visiblePositionDown() { let poss = this.visiblePosition; poss[1]++; return poss }

    get schemePosition() { return [this.grid.dragX + this.gridX, this.grid.dragY + this.gridY]; }
    get schemePositionLeft() { let poss = this.schemePosition; poss[0]--; return poss }
    get schemePositionRight() { let poss = this.schemePosition; poss[0]++; return poss }
    get schemePositionUp() { let poss = this.schemePosition; poss[1]--; return poss }
    get schemePositionDown() { let poss = this.schemePosition; poss[1]++; return poss }

    get type() {
        return this.grid.scheme.findCellOrEmpty(...this.schemePosition).content;
    }
    get typeOfRoad() {
        return this.grid.scheme.findCellOrEmpty(...this.schemePosition).road ? this.grid.scheme.findCellOrEmpty(...this.schemePosition).road.type : false;
    }
    get typeOfSemiconductor() {
        return this.grid.scheme.findCellOrEmpty(...this.schemePosition).semiconductor ? this.grid.scheme.findCellOrEmpty(...this.schemePosition).semiconductor.type : false;
    }
    get semi() {
        return this.grid.scheme.findSemiconductorCellOrEmpty(...this.schemePosition).semiconductor;
    }

    get scheme() { return this.grid.scheme; }
}