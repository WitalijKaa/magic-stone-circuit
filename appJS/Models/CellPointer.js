class CellPointer extends AbstractCell {

    zone = OVER_CENTER;
    sidePointer;

    init(grid) {
        this.sprite.alpha = 0;

        this.sidePointer = Factory.sceneModel(MM.cellPointerSide);
        this.sidePointer.sprite.alpha = 0;
        Scene.addModelToContainer(this.sidePointer, this);

        return super.init(grid);
    }

    showZone(zone, xCell, yCell) {
        this.sprite.alpha = 1;
        if (OVER_CENTER != zone) {
            this.sidePointer.sprite.alpha = 1;
        }
        if (zone != this.zone) {
            this.zone = zone;
            if (OVER_CENTER == zone) {
                this.sidePointer.sprite.alpha = 0;
                return;
            }
            let zConf = this.configParams.textureForZone[zone];
            this.sidePointer.changeTexture(zConf.path, null, zConf.rotate)
        }

        this.setPosition(xCell, yCell);
    }

    hideZone() {
        this.sprite.alpha = 0;
        this.sidePointer.sprite.alpha = 0;
    }

    findOverZoneType(pxLocalX, pxLocalY) {
        if (pxLocalY <= this.grid.cellPxSizeConfig.lineA) {
            if (pxLocalX < this.grid.cellPxSizeConfig.lineB) { return UP; }
            return RIGHT;
        }
        if (pxLocalY <= this.grid.cellPxSizeConfig.lineB) {
            if (pxLocalX < this.grid.cellPxSizeConfig.lineA) { return LEFT; }
            if (pxLocalX < this.grid.cellPxSizeConfig.lineB) { return OVER_CENTER; }
            return RIGHT;
        }
        else {
            if (pxLocalX < this.grid.cellPxSizeConfig.lineA) { return LEFT; }
            return DOWN;
        }
    }
}