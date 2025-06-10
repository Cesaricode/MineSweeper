import { Tile } from "./tile.js";
import { isInBounds } from "./util.js";
import { directions } from "./util.js";

export class Board {
    readonly rows: number;
    readonly cols: number;
    private _bombCount: number;
    private _grid: Tile[][] = [];
    private _flagCount: number = 0;
    private _bombsDeployed: boolean = false;

    constructor(rows: number, cols: number, bombCount: number) {
        this.rows = rows;
        this.cols = cols;
        this._bombCount = bombCount;
        this.populateGrid();
    }

    public get grid(): Tile[][] {
        return this._grid;
    }

    public get bombCount(): number {
        return this._bombCount;
    }

    private populateGrid(): void {
        for (let i = 0; i < this.rows; i++) {
            this._grid[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this._grid[i][j] = new Tile(i, j);
            }
        }
    }

    public deployBombs(excludeRow: number, excludeCol: number): void {
        if (this._bombsDeployed) {
            throw new Error("Bombs have already been deployed.");
        }
        const positions: [number, number][] = this.generateCandidatePositions(excludeRow, excludeCol);
        this.shufflePositions(positions);
        this.placeBombs(positions);
        this.setAdjacentBombCounts();
        this._bombsDeployed = true;
    }

    private generateCandidatePositions(excludeRow: number, excludeCol: number): [number, number][] {
        const positions: [number, number][] = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!(i === excludeRow && j === excludeCol)) {
                    positions.push([i, j]);
                }
            }
        }
        return positions;
    }

    private shufflePositions(positions: [number, number][]): void {
        for (let i = positions.length - 1; i > 0; i--) {
            const j: number = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
    }

    private placeBombs(positions: [number, number][]): void {
        for (let i = 0; i < this._bombCount; i++) {
            const [row, col]: number[] = positions[i];
            this._grid[row][col].setBomb();
        }
    }

    private setAdjacentBombCounts(): void {
        this.forEachTile((tile: Tile) => {
            const count: number = this.calcAdjacentBombCount(tile);
            tile.setAdjacentBombCount(count);
        });
    }

    private calcAdjacentBombCount(tile: Tile): number {
        this.assertInBounds(tile.row, tile.col, "calcAdjacentBombCount");
        const numRows: number = this._grid.length;
        const numCols: number = this._grid[0].length;
        let count: number = 0;

        for (const [dRow, dCol] of directions) {
            const newRow: number = tile.row + dRow;
            const newCol: number = tile.col + dCol;

            if (isInBounds(newRow, newCol, numRows, numCols) && this._grid[newRow][newCol].isBomb()) {
                count++;
            }
        }
        return count;
    }

    public getTile(row: number, col: number): Tile {
        this.assertInBounds(row, col, "getTile");
        return this._grid[row][col];
    }

    public toggleFlag(tile: Tile): void {
        this.assertInBounds(tile.row, tile.col, "toggleFlag");

        if (tile.status === "hidden") {
            tile.setStatus("flagged");
            this._flagCount++;
        } else if (tile.status === "flagged") {
            tile.setStatus("hidden");
            this._flagCount--;
        }
    }

    private assertInBounds(row: number, col: number, methodName: string): void {
        if (!isInBounds(row, col, this.rows, this.cols)) {
            throw new RangeError(`${methodName}: invalid coordinates (${row}, ${col})`);
        }
    }

    public getNeighbors(tile: Tile): Tile[] {
        const neighbors: Tile[] = [];

        for (const [dx, dy] of directions) {
            const newRow: number = tile.row + dx;
            const newCol: number = tile.col + dy;

            if (isInBounds(newRow, newCol, this.rows, this.cols)) {
                neighbors.push(this.getTile(newRow, newCol));
            }
        }

        return neighbors;
    }

    public get flagCount(): number {
        return this._flagCount;
    }

    public revealBombs(): void {
        this.forEachTile(tile => {
            if (tile.isBomb() && tile.status !== "revealed") {
                tile.setStatus("revealed");
            }
        });
    }

    public revealIncorrectFlags(): void {
        this.forEachTile(tile => {
            if (tile.status === "flagged" && !tile.isBomb()) {
                tile.setStatus("wrong-flag");
            }
        });
    }

    public forEachTile(callback: (tile: Tile) => void): void {
        this._grid.forEach(row => {
            row.forEach(tile => {
                callback(tile);
            });
        });
    }

    public restoreInternalState(flagCount: number, bombCount: number): void {
        this._flagCount = flagCount;
        this._bombCount = bombCount;
        this._bombsDeployed = true;
    }

    public get bombsDeployed(): boolean {
        return this._bombsDeployed;
    }
}
