import { Tile } from "./tile.js";
import { isInBounds } from "./util.js";
import { directions } from "./util.js";
export class Board {
    constructor(rows, cols, bombCount) {
        this._grid = [];
        this._flagCount = 0;
        this._bombsDeployed = false;
        this.rows = rows;
        this.cols = cols;
        this.bombCount = bombCount;
        this.populateGrid();
    }
    populateGrid() {
        for (let i = 0; i < this.rows; i++) {
            this._grid[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this._grid[i][j] = new Tile(i, j);
            }
        }
    }
    deployBombs(excludeRow, excludeCol) {
        if (this._bombsDeployed) {
            throw new Error("Bombs have already been deployed.");
        }
        const positions = this.generateCandidatePositions(excludeRow, excludeCol);
        this.shufflePositions(positions);
        this.placeBombs(positions);
        this.setAdjacentBombCounts();
        this._bombsDeployed = true;
    }
    generateCandidatePositions(excludeRow, excludeCol) {
        const positions = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!(i === excludeRow && j === excludeCol)) {
                    positions.push([i, j]);
                }
            }
        }
        return positions;
    }
    shufflePositions(positions) {
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
    }
    placeBombs(positions) {
        for (let i = 0; i < this.bombCount; i++) {
            const [row, col] = positions[i];
            this._grid[row][col].setBomb();
        }
    }
    setAdjacentBombCounts() {
        this.forEachTile((tile) => {
            const count = this.calcAdjacentBombCount(tile);
            tile.setAdjacentBombCount(count);
        });
    }
    calcAdjacentBombCount(tile) {
        this.assertInBounds(tile.row, tile.col, "calcAdjacentBombCount");
        const numRows = this._grid.length;
        const numCols = this._grid[0].length;
        let count = 0;
        for (const [dRow, dCol] of directions) {
            const newRow = tile.row + dRow;
            const newCol = tile.col + dCol;
            if (isInBounds(newRow, newCol, numRows, numCols) && this._grid[newRow][newCol].isBomb()) {
                count++;
            }
        }
        return count;
    }
    getTile(row, col) {
        this.assertInBounds(row, col, "getTile");
        return this._grid[row][col];
    }
    toggleFlag(tile) {
        this.assertInBounds(tile.row, tile.col, "toggleFlag");
        if (tile.status === "hidden") {
            tile.setStatus("flagged");
            this._flagCount++;
        }
        else if (tile.status === "flagged") {
            tile.setStatus("hidden");
            this._flagCount--;
        }
    }
    assertInBounds(row, col, methodName) {
        if (!isInBounds(row, col, this.rows, this.cols)) {
            throw new RangeError(`${methodName}: invalid coordinates (${row}, ${col})`);
        }
    }
    getNeighbors(tile) {
        const neighbors = [];
        for (const [dx, dy] of directions) {
            const newRow = tile.row + dx;
            const newCol = tile.col + dy;
            if (isInBounds(newRow, newCol, this.rows, this.cols)) {
                neighbors.push(this.getTile(newRow, newCol));
            }
        }
        return neighbors;
    }
    get flagCount() {
        return this._flagCount;
    }
    revealBombs() {
        this.forEachTile(tile => {
            if (tile.isBomb() && tile.status !== "revealed") {
                tile.setStatus("revealed");
            }
        });
    }
    revealIncorrectFlags() {
        this.forEachTile(tile => {
            if (tile.status === "flagged" && !tile.isBomb()) {
                tile.setStatus("wrong-flag");
            }
        });
    }
    forEachTile(callback) {
        this._grid.forEach(row => {
            row.forEach(tile => {
                callback(tile);
            });
        });
    }
}
