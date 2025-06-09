import { Board } from "./board.js";
import { difficultyBombRange, getBombCount } from "./difficulty.js";
import { isInBounds } from "./util.js";
import { directions } from "./util.js";
export class Game {
    constructor(rows, cols, difficulty) {
        this._isFirstMove = true;
        this._status = "playing";
        const isValid = (n) => n >= 5 && n <= 50;
        if (!isValid(rows))
            throw new Error("Invalid row count");
        if (!isValid(cols))
            throw new Error("Invalid column count");
        if (!(difficulty in difficultyBombRange)) {
            throw new Error(`Invalid difficulty: ${difficulty}`);
        }
        this.rows = rows;
        this.cols = cols;
        this.difficulty = difficulty;
        const bombCount = getBombCount(rows, cols, difficulty);
        this._board = new Board(rows, cols, bombCount);
        this._tilesToReveal = rows * cols - bombCount;
    }
    reveal(row, col) {
        this.assertPlaying();
        this.ensureBombsDeployed(row, col);
        const tile = this._board.getTile(row, col);
        if (tile.isFlagged()) {
            return;
        }
        if (tile.isBomb()) {
            this.triggerBomb();
            return;
        }
        if (tile.status === "revealed" && tile.adjacentBombCount !== 0) {
            this.chordReveal(tile);
            return;
        }
        if (tile.adjacentBombCount === 0) {
            this.floodReveal(row, col);
        }
        else {
            this.revealTile(tile);
        }
    }
    chordReveal(tile) {
        if (tile.status !== "revealed" || tile.adjacentBombCount === 0)
            return;
        const neighbors = this._board.getNeighbors(tile);
        const flaggedCount = neighbors.filter(t => t.status === "flagged").length;
        if (flaggedCount === tile.adjacentBombCount) {
            for (const neighbor of neighbors) {
                if (neighbor.status === "hidden") {
                    this.reveal(neighbor.row, neighbor.col);
                }
            }
        }
    }
    revealTile(tile) {
        this.assertHidden(tile);
        tile.reveal();
        this.handleSuccessfulReveal();
    }
    ensureBombsDeployed(row, col) {
        if (this._isFirstMove) {
            this._board.deployBombs(row, col);
            this._isFirstMove = false;
        }
    }
    floodReveal(row, col) {
        const stack = [[row, col]];
        const visited = new Set();
        while (stack.length) {
            const [r, c] = stack.pop();
            const key = `${r},${c}`;
            if (visited.has(key)) {
                continue;
            }
            visited.add(key);
            const tile = this._board.getTile(r, c);
            if (tile.status !== "hidden")
                continue;
            this.floodRevealTile(tile);
            if (tile.adjacentBombCount === 0) {
                for (const [dr, dc] of directions) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (isInBounds(nr, nc, this.rows, this.cols)) {
                        if (!visited.has(`${nr},${nc}`)) {
                            stack.push([nr, nc]);
                        }
                    }
                }
            }
        }
    }
    floodRevealTile(tile) {
        this.assertHidden(tile);
        if (tile.isBomb()) {
            return;
        }
        tile.reveal();
        this.handleSuccessfulReveal();
    }
    triggerBomb() {
        this._status = "lost";
        this._board.revealBombs();
        this._board.revealIncorrectFlags();
    }
    toggleFlag(row, col) {
        this.assertPlaying();
        this._board.toggleFlag(this._board.getTile(row, col));
    }
    getTile(row, col) {
        return this._board.getTile(row, col);
    }
    get status() {
        return this._status;
    }
    get board() {
        return this._board;
    }
    assertPlaying() {
        if (this._status !== "playing") {
            throw new Error(`Cannot modify board state; game is already ${this._status}`);
        }
    }
    assertHidden(tile) {
        if (tile.status !== "hidden") {
            throw new Error(`Cannot reveal tile at (${tile.row}, ${tile.col}); current status is '${tile.status}'`);
        }
    }
    getNeighbors(tile) {
        return this._board.getNeighbors(tile);
    }
    handleSuccessfulReveal() {
        this._tilesToReveal--;
        if (this._tilesToReveal === 0) {
            this._status = "won";
        }
    }
}
