const COLOR_VIOLET_ROAD = 0x7e57c2;
const COLOR_RED_ROAD = 0xe53935;
const COLOR_INDIGO_ROAD = 0x3949ab;
const COLOR_ORANGE_ROAD = 0xffa726;

const SCENE = [
    {
        model: SchemeGrid,
        name: 'mainGrid',
        params: {
            cellSizePx: 40, // size of cell without zoom
            cell: {
                model: SchemeCell,
                texture: TT.cell,
            },
        }
    },
];