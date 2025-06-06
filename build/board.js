import { Tile } from "./tile.js";
import { isInBounds } from "./util.js";
import { directions } from "./util.js";
export class Board {
    constructor(rows, cols, bombCount) {
        this.grid = [];
        this.bombsDeployed = false;
        this.rows = rows;
        this.cols = cols;
        this.bombCount = bombCount;
        console.log(`[Board] Initializing board with rows=${rows}, cols=${cols}, bombCount=${bombCount}`);
        this.populateGrid();
    }
    populateGrid() {
        console.log(`[Board] Populating grid...`);
        for (let i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.grid[i][j] = new Tile(i, j);
            }
        }
        console.log(`[Board] Grid populated.`);
    }
    deployBombs(excludeRow, excludeCol) {
        console.log(`[Board] deployBombs() called, excluding tile (${excludeRow}, ${excludeCol})`);
        if (this.bombsDeployed) {
            console.error(`[Board] Bombs already deployed!`);
            throw new Error("Bombs have already been deployed.");
        }
        const positions = this.generateCandidatePositions(excludeRow, excludeCol);
        console.log(`[Board] Candidate positions for bombs generated: ${positions.length} positions`);
        this.shufflePositions(positions);
        console.log(`[Board] Candidate positions shuffled.`);
        this.placeBombs(positions);
        console.log(`[Board] Bombs placed.`);
        this.setAdjacentBombCounts();
        console.log(`[Board] Adjacent bomb counts set.`);
        this.bombsDeployed = true;
    }
    generateCandidatePositions(excludeRow, excludeCol) {
        console.log(`[Board] Generating candidate positions excluding (${excludeRow}, ${excludeCol})`);
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
        console.log(`[Board] Placing bombs at:`);
        for (let i = 0; i < this.bombCount; i++) {
            const [row, col] = positions[i];
            this.grid[row][col].setBomb();
            console.log(`  - (${row}, ${col})`);
        }
    }
    setAdjacentBombCounts() {
        console.log(`[Board] Calculating adjacent bomb counts for all tiles...`);
        this.grid.forEach(row => {
            row.forEach(tile => {
                const count = this.calcAdjacentBombCount(tile.row, tile.col);
                tile.setAdjacentBombCount(count);
                console.log(`[Board] Tile (${tile.row}, ${tile.col}) adjacent bomb count set to ${count}`);
            });
        });
    }
    calcAdjacentBombCount(row, col) {
        this.assertInBounds(row, col, "calcAdjacentBombCount");
        const numRows = this.grid.length;
        const numCols = this.grid[0].length;
        let count = 0;
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            if (isInBounds(newRow, newCol, numRows, numCols) && this.grid[newRow][newCol].isBomb) {
                count++;
            }
        }
        return count;
    }
    getTile(row, col) {
        this.assertInBounds(row, col, "getTile");
        console.log(`[Board] getTile() called on (${row}, ${col})`);
        return this.grid[row][col];
    }
    toggleFlag(row, col) {
        this.assertInBounds(row, col, "toggleFlag");
        const tile = this.grid[row][col];
        console.log(`[Board] toggleFlag() on tile (${row}, ${col}), current status: ${tile.status}`);
        if (tile.status === "hidden") {
            tile.setStatus("flagged");
            console.log(`[Board] Tile (${row}, ${col}) flagged.`);
        }
        else if (tile.status === "flagged") {
            tile.setStatus("hidden");
            console.log(`[Board] Tile (${row}, ${col}) flag removed.`);
        }
    }
    revealTile(row, col) {
        this.assertInBounds(row, col, "revealTile");
        console.log(`[Board] revealTile() called on (${row}, ${col})`);
        this.grid[row][col].setStatus("revealed");
    }
    assertInBounds(row, col, methodName) {
        if (!isInBounds(row, col, this.rows, this.cols)) {
            console.error(`[Board] ${methodName} - invalid coordinates (${row}, ${col})`);
            throw new RangeError(`${methodName}: invalid coordinates (${row}, ${col})`);
        }
    }
    debugPrintBoard() {
        console.log("[Board] Current board state:");
        for (let i = 0; i < this.rows; i++) {
            let rowStr = "";
            for (let j = 0; j < this.cols; j++) {
                const tile = this.grid[i][j];
                if (tile.isBomb) {
                    rowStr += "💣 ";
                }
                else {
                    rowStr += (tile.adjacentBombCount > 0 ? tile.adjacentBombCount.toString() : ".") + " ";
                }
            }
            console.log(rowStr.trim());
        }
    }
}
