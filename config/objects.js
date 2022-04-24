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