export type GridZone = 'Center' | 'Up' | 'Right' | 'Down' | 'Left';

export type GridCursor = {
    x: number,
    y: number,
    zone: GridZone,
}
