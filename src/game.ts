import { Board } from "./board.js";
import { Tile, TileStatus } from "./tile.js";
import { Difficulty, difficultyBombRange, getBombCount } from "./difficulty.js";
import { SavedGameState } from "./util.js";
import { directions } from "./util.js";
import { GameTimer } from "./gametimer.js";

export type GameStatus = "playing" | "won" | "lost";

export class Game extends EventTarget {
    readonly rows: number;
    readonly cols: number;
    readonly difficulty: Difficulty;
    private readonly _board: Board;
    private readonly _timer: GameTimer;
    private _isFirstMove: boolean = true;
    private _status: GameStatus = "playing";
    private _tilesToReveal: number;

    constructor(rows: number, cols: number, difficulty: Difficulty) {
        super();
        this.validateDimensions(rows, cols);
        this.validateDifficulty(difficulty);

        this.rows = rows;
        this.cols = cols;
        this.difficulty = difficulty;

        const bombCount: number = this.calculateBombCount(rows, cols, difficulty);
        this._board = new Board(rows, cols, bombCount);
        this._timer = new GameTimer();
        this._tilesToReveal = rows * cols - bombCount;
    }

    public reveal(row: number, col: number): void {
        this.assertPlaying();
        this.ensureBombsDeployed(row, col);
        this._timer.startTimer();

        const tile: Tile = this._board.getTile(row, col);

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

        if (tile.status === "revealed") {
            return;
        }

        if (tile.adjacentBombCount === 0) {
            this.floodReveal(row, col);
        } else {
            this.revealTile(tile);
        }
    }

    private chordReveal(tile: Tile): void {
        if (tile.status !== "revealed" || tile.adjacentBombCount === 0) return;
        const neighbors: Tile[] = this._board.getNeighbors(tile);
        const flaggedCount: number = neighbors.filter(t => t.status === "flagged").length;

        if (flaggedCount === tile.adjacentBombCount) {
            for (const neighbor of neighbors) {
                if (neighbor.status === "hidden") {
                    this.reveal(neighbor.row, neighbor.col);
                }
            }
        }
    }

    private revealTile(tile: Tile): void {
        this.assertHidden(tile);
        tile.reveal();
        this.handleSuccessfulReveal(tile.row, tile.col);
    }

    private ensureBombsDeployed(row: number, col: number): void {
        if (this._isFirstMove) {
            this._board.deployBombs(row, col);
            this._isFirstMove = false;
        }
    }

    private floodReveal(row: number, col: number): void {
        const stack: [number, number][] = this.createFloodStack(row, col);
        const visited: boolean[][] = this.createVisitedArray();
        const revealed: { row: number, col: number; }[] = [];

        while (stack.length) {
            const [r, c] = stack.pop()!;
            if (visited[r][c]) continue;
            visited[r][c] = true;
            const tile: Tile = this._board.getTile(r, c);
            if (tile.status !== "hidden") continue;
            this.floodRevealTile(tile, revealed);

            if (tile.adjacentBombCount === 0) {
                this.pushUnvisitedNeighbors(stack, visited, r, c);
            }
        }
        this.handleSuccessfulFloodReveal(revealed);
    }

    private createFloodStack(row: number, col: number): [number, number][] {
        return [[row, col]];
    }

    private createVisitedArray(): boolean[][] {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    }

    private pushUnvisitedNeighbors(stack: [number, number][], visited: boolean[][], r: number, c: number): void {
        for (const [dr, dc] of directions) {
            const nr: number = r + dr;
            const nc: number = c + dc;
            if (
                nr >= 0 && nr < this.rows &&
                nc >= 0 && nc < this.cols &&
                !visited[nr][nc]
            ) {
                stack.push([nr, nc]);
            }
        }
    }

    private floodRevealTile(tile: Tile, revealed: { row: number, col: number; }[]): void {
        this.assertHidden(tile);
        if (tile.isBomb()) {
            return;
        }
        tile.reveal();
        revealed.push({ row: tile.row, col: tile.col });
    }

    private triggerBomb(): void {
        this._status = "lost";
        this._board.revealBombs();
        this._board.revealIncorrectFlags();
        this._timer.stopTimer();
        this.dispatchEvent(new CustomEvent("gameLost"));
    }

    public toggleFlag(row: number, col: number): void {
        this.assertPlaying();
        const tile: Tile = this._board.getTile(row, col);
        if (tile.status === "revealed") {
            return;
        }
        this._board.toggleFlag(tile);
        this.dispatchEvent(new CustomEvent<{ row: number; col: number; }>("flagToggled", {
            detail: { row, col }
        }));
    }

    public getTile(row: number, col: number): Tile {
        return this._board.getTile(row, col);
    }

    public get status(): GameStatus {
        return this._status;
    }

    public get board(): Board {
        return this._board;
    }

    public get timer(): GameTimer {
        return this._timer;
    }

    public get tilesToReveal(): number {
        return this._tilesToReveal;
    }

    private assertPlaying(): void {
        if (this._status !== "playing") {
            throw new Error(`Cannot modify board state; game is already ${this._status}`);
        }
    }

    private assertHidden(tile: Tile): void {
        if (tile.status !== "hidden") {
            throw new Error(`Cannot reveal tile at (${tile.row}, ${tile.col}); current status is '${tile.status}'`);
        }
    }

    public getNeighbors(tile: Tile): Tile[] {
        return this._board.getNeighbors(tile);
    }

    private handleSuccessfulReveal(row: number, col: number): void {
        this._tilesToReveal--;
        this.dispatchEvent(new CustomEvent<{ row: number; col: number; }>("tileRevealed", {
            detail: { row, col }
        }));
        if (this._tilesToReveal === 0) {
            this._status = "won";
            this.flagRemainingBombs();
            this._timer.stopTimer();
            this.dispatchEvent(new CustomEvent("gameWon"));
        }
    }

    private handleSuccessfulFloodReveal(revealed: { row: number, col: number; }[]): void {
        this._tilesToReveal -= revealed.length;
        this.dispatchEvent(new CustomEvent<{ tiles: { row: number, col: number; }[]; }>("floodTilesRevealed", {
            detail: { tiles: revealed }
        }));
        if (this._tilesToReveal === 0) {
            this._status = "won";
            this.flagRemainingBombs();
            this._timer.stopTimer();
            this.dispatchEvent(new CustomEvent("gameWon"));
        }
    }


    private flagRemainingBombs(): void {
        this._board.forEachTile(tile => {
            if (tile.isBomb() && tile.status !== "flagged") {
                this._board.toggleFlag(tile);
            }
        });
    }

    private setStatus(status: GameStatus): void {
        this._status = status;
    }

    public restoreBoardState(state: SavedGameState): void {
        let flagCount: number = 0;
        let bombCount: number = 0;
        let anyRevealed: boolean = false;
        for (let r = 0; r < state.rows; r++) {
            for (let c = 0; c < state.cols; c++) {
                const tileState: { status: string; isBomb: boolean; adjacentBombCount: number; } = state.board[r][c];
                const tile: Tile = this.board.grid[r][c];
                tile.setStatus(tileState.status as TileStatus);
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
        } else {
            this.board.restoreInternalState(flagCount, bombCount);
            this._isFirstMove = false;
            this._tilesToReveal = state.tilesToReveal;
        }
        this.setStatus(state.status as GameStatus);
    }

    private validateDimensions(rows: number, cols: number): void {
        const isValid: (n: number) => boolean = (n: number) => n >= 5 && n <= 100;
        if (!isValid(rows)) throw new Error("Invalid row count");
        if (!isValid(cols)) throw new Error("Invalid column count");
    }

    private validateDifficulty(difficulty: Difficulty): void {
        if (!(difficulty in difficultyBombRange)) {
            throw new Error(`Invalid difficulty: ${difficulty}`);
        }
    }

    private calculateBombCount(rows: number, cols: number, difficulty: Difficulty): number {
        return getBombCount(rows, cols, difficulty);
    }
}
