class CellPointer extends AbstractCell {

    zone = OVER_CENTER;

    showZone(zone, xCell, yCell) {
        if (zone != this.zone) {
            this.zone = zone;
            let zConf = this.configParams.textureForZone[zone];
            this.changeTexture(zConf.path, null, zConf.rotate)
        }

        this.setPosition(xCell, yCell);
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