export const directions: [number, number][] = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];

export function isInBounds(x: number, y: number, numRows: number, numCols: number): boolean {
    return x >= 0 && x < numRows && y >= 0 && y < numCols;
}