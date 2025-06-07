import { Tile } from "./tile.js";
import { isInBounds } from "./util.js";
import { directions } from "./util.js";

export class Board {
    rows: number;
    cols: number;
    grid: Tile[][] = [];
    bombCount: number;
    flagCount: number = 0;
    bombsDeployed: boolean = false;

    constructor(rows: number, cols: number, bombCount: number) {
        this.rows = rows;
        this.cols = cols;
        this.bombCount = bombCount;
        this.populateGrid();
    }

    private populateGrid(): void {
        for (let i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.grid[i][j] = new Tile(i, j);
            }
        }
    }

    public deployBombs(excludeRow: number, excludeCol: number): void {
        if (this.bombsDeployed) {
            throw new Error("Bombs have already been deployed.");
        }
        const positions = this.generateCandidatePositions(excludeRow, excludeCol);
        this.shufflePositions(positions);
        this.placeBombs(positions);
        this.setAdjacentBombCounts();
        this.bombsDeployed = true;
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
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
    }

    private placeBombs(positions: [number, number][]): void {
        for (let i = 0; i < this.bombCount; i++) {
            const [row, col] = positions[i];
            this.grid[row][col].setBomb();
        }
    }

    private setAdjacentBombCounts(): void {
        this.grid.forEach(row => {
            row.forEach(tile => {
                const count = this.calcAdjacentBombCount(tile.row, tile.col);
                tile.setAdjacentBombCount(count);
            });
        });
    }

    private calcAdjacentBombCount(row: number, col: number): number {
        this.assertInBounds(row, col, "calcAdjacentBombCount");
        const numRows: number = this.grid.length;
        const numCols: number = this.grid[0].length;
        let count: number = 0;

        for (const [dRow, dCol] of directions) {
            const newRow: number = row + dRow;
            const newCol: number = col + dCol;

            if (isInBounds(newRow, newCol, numRows, numCols) && this.grid[newRow][newCol].isBomb) {
                count++;
            }
        }
        return count;
    }

    public getTile(row: number, col: number): Tile {
        this.assertInBounds(row, col, "getTile");
        return this.grid[row][col];
    }

    public toggleFlag(row: number, col: number): void {
        this.assertInBounds(row, col, "toggleFlag");
        const tile: Tile = this.grid[row][col];

        if (tile.status === "hidden") {
            tile.setStatus("flagged");
            this.flagCount++;
        } else if (tile.status === "flagged") {
            tile.setStatus("hidden");
            this.flagCount--;
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
}
