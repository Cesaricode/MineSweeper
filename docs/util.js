export const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];
export function isInBounds(x, y, numRows, numCols) {
    return x >= 0 && x < numRows && y >= 0 && y < numCols;
}
