export const directions: [number, number][] = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];

export function isInBounds(x: number, y: number, numRows: number, numCols: number): boolean {
    return x >= 0 && x < numRows && y >= 0 && y < numCols;
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timeout: number | null = null;
    return function (this: any, ...args: any[]) {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = window.setTimeout(() => {
            fn.apply(this, args);
            timeout = null;
        }, delay);
    } as T;
}

export interface SavedGameState {
    rows: number;
    cols: number;
    difficulty: string;
    board: {
        status: string;
        isBomb: boolean;
        adjacentBombCount: number;
    }[][];
    elapsedTime: number;
    status: string;
}