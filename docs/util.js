export const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];
export function isInBounds(x, y, numRows, numCols) {
    return x >= 0 && x < numRows && y >= 0 && y < numCols;
}
export function debounce(fn, delay) {
    let timeout = null;
    return function (...args) {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = window.setTimeout(() => {
            fn.apply(this, args);
            timeout = null;
        }, delay);
    };
}
