import { Board } from "./board.js";
import { difficultyBombRange, getBombCount } from "./difficulty.js";
import { directions } from "./util.js";
export class Game extends EventTarget {
    constructor(rows, cols, difficulty) {
        super();
        this._isFirstMove = true;
        this._status = "playing";
        this.validateDimensions(rows, cols);
        this.validateDifficulty(difficulty);
        this.rows = rows;
        this.cols = cols;
        this.difficulty = difficulty;
        const bombCount = this.calculateBombCount(rows, cols, difficulty);
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
        this.handleSuccessfulReveal(tile.row, tile.col);
    }
    ensureBombsDeployed(row, col) {
        if (this._isFirstMove) {
            this._board.deployBombs(row, col);
            this._isFirstMove = false;
        }
    }
    floodReveal(row, col) {
        const stack = this.createFloodStack(row, col);
        const visited = this.createVisitedArray();
        const revealed = [];
        while (stack.length) {
            const [r, c] = stack.pop();
            if (visited[r][c])
                continue;
            visited[r][c] = true;
            const tile = this._board.getTile(r, c);
            if (tile.status !== "hidden")
                continue;
            this.floodRevealTile(tile, revealed);
            if (tile.adjacentBombCount === 0) {
                this.pushUnvisitedNeighbors(stack, visited, r, c);
            }
        }
        this.handleSuccesfulFloodReveal(revealed);
    }
    createFloodStack(row, col) {
        return [[row, col]];
    }
    createVisitedArray() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    }
    pushUnvisitedNeighbors(stack, visited, r, c) {
        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows &&
                nc >= 0 && nc < this.cols &&
                !visited[nr][nc]) {
                stack.push([nr, nc]);
            }
        }
    }
    floodRevealTile(tile, revealed) {
        this.assertHidden(tile);
        if (tile.isBomb()) {
            return;
        }
        tile.reveal();
        revealed.push({ row: tile.row, col: tile.col });
    }
    triggerBomb() {
        this._status = "lost";
        this._board.revealBombs();
        this._board.revealIncorrectFlags();
        this.dispatchEvent(new CustomEvent("gameLost"));
    }
    toggleFlag(row, col) {
        this.assertPlaying();
        const tile = this._board.getTile(row, col);
        if (tile.status === "revealed") {
            return;
        }
        this._board.toggleFlag(tile);
        this.dispatchEvent(new CustomEvent("flagToggled", {
            detail: { row, col }
        }));
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
    get tilesToReveal() {
        return this._tilesToReveal;
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
    handleSuccessfulReveal(row, col) {
        this._tilesToReveal--;
        this.dispatchEvent(new CustomEvent("tileRevealed", {
            detail: { row, col }
        }));
        if (this._tilesToReveal === 0) {
            this._status = "won";
            this.flagRemainingBombs();
            this.dispatchEvent(new CustomEvent("gameWon"));
        }
    }
    handleSuccesfulFloodReveal(revealed) {
        this._tilesToReveal -= revealed.length;
        this.dispatchEvent(new CustomEvent("floodTilesRevealed", {
            detail: { tiles: revealed }
        }));
        if (this._tilesToReveal === 0) {
            this._status = "won";
            this.flagRemainingBombs();
            this.dispatchEvent(new CustomEvent("gameWon"));
        }
    }
    flagRemainingBombs() {
        this._board.forEachTile(tile => {
            if (tile.isBomb() && tile.status !== "flagged") {
                this._board.toggleFlag(tile);
            }
        });
    }
    setStatus(status) {
        this._status = status;
    }
    restoreBoardState(state) {
        let flagCount = 0;
        let bombCount = 0;
        let anyRevealed = false;
        for (let r = 0; r < state.rows; r++) {
            for (let c = 0; c < state.cols; c++) {
                const tileState = state.board[r][c];
                const tile = this.board.grid[r][c];
                tile.setStatus(tileState.status);
                if (tileState.isBomb) {
                    bombCount++;
                    tile.setBomb();
                }
                tile.setAdjacentBombCount(tileState.adjacentBombCount);
                if (tileState.status === "flagged") {
                    flagCount++;
                }
                if (tileState.status !== "hidden") {
                    anyRevealed = true;
                }
            }
        }
        if (bombCount === 0 && !anyRevealed) {
            this.board.restoreInternalState(flagCount, bombCount);
            this._isFirstMove = true;
        }
        else {
            this.board.restoreInternalState(flagCount, bombCount);
            this._isFirstMove = false;
            this._tilesToReveal = state.tilesToReveal;
        }
        this.setStatus(state.status);
    }
    validateDimensions(rows, cols) {
        const isValid = (n) => n >= 5 && n <= 100;
        if (!isValid(rows))
            throw new Error("Invalid row count");
        if (!isValid(cols))
            throw new Error("Invalid column count");
    }
    validateDifficulty(difficulty) {
        if (!(difficulty in difficultyBombRange)) {
            throw new Error(`Invalid difficulty: ${difficulty}`);
        }
    }
    calculateBombCount(rows, cols, difficulty) {
        return getBombCount(rows, cols, difficulty);
    }
}
