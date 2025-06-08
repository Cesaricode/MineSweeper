import { Board } from "./board.js";
import { Tile } from "./tile.js";
import { Difficulty, getBombCount } from "./difficulty.js";
import { isInBounds } from "./util.js";
import { directions } from "./util.js";

export type GameStatus = "playing" | "won" | "lost";

export class Game {
    readonly rows: number;
    readonly cols: number;
    readonly difficulty: Difficulty;
    private readonly _board: Board;
    private _isFirstMove: boolean = true;
    private _status: GameStatus = "playing";
    private _tilesToReveal: number;

    constructor(rows: number, cols: number, difficulty: Difficulty) {
        this.rows = rows;
        this.cols = cols;
        this.difficulty = difficulty;
        const bombCount = getBombCount(rows, cols, difficulty);
        this._board = new Board(rows, cols, bombCount);
        this._tilesToReveal = rows * cols - bombCount;
    }

    public reveal(row: number, col: number): void {
        this.assertPlaying();
        this.ensureBombsDeployed(row, col);

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
        this.handleSuccessfulReveal();
    }

    private ensureBombsDeployed(row: number, col: number): void {
        if (this._isFirstMove) {
            this._board.deployBombs(row, col);
            this._isFirstMove = false;
        }
    }

    private floodReveal(row: number, col: number): void {
        const stack: [number, number][] = [[row, col]];
        const visited = new Set<string>();

        while (stack.length) {
            const [r, c] = stack.pop()!;
            const key = `${r},${c}`;
            if (visited.has(key)) {
                continue;
            }
            visited.add(key);
            const tile = this._board.getTile(r, c);
            if (tile.status !== "hidden") continue;
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

    private floodRevealTile(tile: Tile): void {
        this.assertHidden(tile);
        if (tile.isBomb()) {
            return;
        }
        tile.reveal();
        this.handleSuccessfulReveal();
    }

    private triggerBomb(): void {
        this._status = "lost";
        this._board.revealBombs();
        this._board.revealIncorrectFlags();
    }

    public toggleFlag(row: number, col: number): void {
        this.assertPlaying();
        this._board.toggleFlag(this._board.getTile(row, col));
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

    private handleSuccessfulReveal(): void {
        this._tilesToReveal--;
        if (this._tilesToReveal === 0) {
            this._status = "won";
        }
    }
}
