const MM = {
    schemeCell: {
        cellSizePx: 40, // size of cell without zoom
        cell: {
            model: SchemeCell,
            texture: TT.cell,
        },
    },
    cellPointer: {
        model: CellPointer,
        texture: TT.zoneCenter,
        params: {
            textureForZone: {
                [OVER_CENTER]: { path: TT.zoneCenter, rotate: null },
                [UP]: { path: TT.zoneSide, rotate: null },
                [RIGHT]: { path: TT.zoneSide, rotate: PIXI_ROTATE_RIGHT },
                [DOWN]: { path: TT.zoneSide, rotate: PIXI_ROTATE_DOWN },
                [LEFT]: { path: TT.zoneSide, rotate: PIXI_ROTATE_LEFT },
            }
        }
    }
};