import { Board } from "./board.js";
import { Tile } from "./tile.js";
import { Difficulty, getBombCount } from "./difficulty.js";
import { isInBounds } from "./util.js";
import { directions } from "./util.js";

export type GameStatus = "playing" | "won" | "lost";

export class Game {
    rows: number;
    cols: number;
    difficulty: Difficulty;
    board: Board;
    isFirstMove: boolean = true;
    status: GameStatus = "playing";
    tilesToReveal: number;

    constructor(rows: number, cols: number, difficulty: Difficulty) {
        this.rows = rows;
        this.cols = cols;
        this.difficulty = difficulty;
        const bombCount: number = getBombCount(rows, cols, difficulty);
        this.board = new Board(rows, cols, bombCount);
        this.tilesToReveal = rows * cols - bombCount;

        console.log(`[Game] Initialized with rows=${rows}, cols=${cols}, difficulty=${difficulty}, bombCount=${bombCount}`);
        console.log(`[Game] Tiles to reveal: ${this.tilesToReveal}`);
    }

    public reveal(row: number, col: number): void {
        console.log(`[Game] reveal() called on tile (${row}, ${col})`);
        this.assertPlaying();
        this.checkFirstMove(row, col);

        const tile: Tile = this.board.getTile(row, col);

        if (tile.isBomb) {
            console.log(`[Game] Bomb triggered at (${tile.row}, ${tile.col})`);
            this.triggerBomb();
            return;
        }

        console.log(`[Game] Tile status before reveal: ${tile.status}, isBomb=${tile.isBomb}, adjacentBombCount=${tile.adjacentBombCount}`);

        if (tile.adjacentBombCount === 0 && this.status === "playing") {
            console.log(`[Game] Starting flood reveal from (${row}, ${col})`);
            this.floodReveal(row, col);
        } else {
            this.revealTile(tile);
        }

        console.log(`[Game] Game status after reveal: ${this.status}, tilesToReveal=${this.tilesToReveal}`);
    }

    private revealTile(tile: Tile): void {
        console.log(`[Game] revealTile() on (${tile.row}, ${tile.col})`);
        this.assertHidden(tile);
        tile.setStatus("revealed");
        console.log(`[Game] Tile (${tile.row}, ${tile.col}) revealed.`);

        this.tilesToReveal--;
        console.log(`[Game] Decremented tilesToReveal: ${this.tilesToReveal}`);

        if (this.tilesToReveal === 0) {
            this.status = "won";
            console.log(`[Game] All tiles revealed. Game won!`);
        }
    }

    private checkFirstMove(row: number, col: number): void {
        if (this.isFirstMove) {
            console.log(`[Game] First move detected at (${row}, ${col}). Deploying bombs.`);
            this.board.deployBombs(row, col);
            this.board.debugPrintBoard();
            this.isFirstMove = false;
        }
    }

    private floodReveal(row: number, col: number): void {
        console.log(`[Game] floodReveal() starting from (${row}, ${col})`);
        const stack: [number, number][] = [[row, col]];
        const visited = new Set<string>();

        console.log(`[Game] stack created: ${stack}`);

        while (stack.length) {
            const [r, c] = stack.pop()!;
            const key = `${r},${c}`;
            if (visited.has(key)) {
                console.log(`[Game] Already visited (${r}, ${c}), skipping`);
                continue;
            }
            visited.add(key);
            const tile = this.board.getTile(r, c);
            if (tile.status !== "hidden") continue;
            console.log(`[Game] floodRevealTile on (${r}, ${c})`);
            this.floodRevealTile(tile);

            if (tile.adjacentBombCount === 0) {
                for (const [dr, dc] of directions) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (isInBounds(nr, nc, this.rows, this.cols)) {
                        if (!visited.has(`${nr},${nc}`)) {
                            console.log(`[Game] Adding neighbor (${nr}, ${nc}) to flood reveal stack`);
                            stack.push([nr, nc]);
                        }
                    } else {
                        console.log(`[Game] Neighbor (${nr}, ${nc}) out of bounds, ignoring`);
                    }
                }
            }
        }

        console.log(`[Game] floodReveal complete.`);
    }

    private floodRevealTile(tile: Tile): void {
        console.log(`[Game] floodRevealTile() on (${tile.row}, ${tile.col})`);
        this.assertHidden(tile);
        if (tile.isBomb) {
            console.log(`[Game] Skipping bomb tile (${tile.row}, ${tile.col}) during flood reveal.`);
            return;
        }
        tile.setStatus("revealed");
        this.tilesToReveal--;
        console.log(`[Game] Tile (${tile.row}, ${tile.col}) flood revealed. tilesToReveal=${this.tilesToReveal}`);
        if (this.tilesToReveal === 0) {
            this.status = "won";
            console.log(`[Game] All tiles revealed during flood reveal. Game won!`);
        }
    }

    private triggerBomb(): void {
        console.log(`[Game] triggerBomb() called. Game lost.`);
        this.status = "lost";
        this.revealBombs();
        this.revealFlagResults();
    }

    private revealBombs(): void {
        console.log(`[Game] revealBombs() called.`);
        this.board.grid.forEach(row => {
            row.forEach(tile => {
                if (tile.isBomb && tile.status !== "revealed") {
                    console.log(`[Game] Revealing bomb tile at (${tile.row}, ${tile.col})`);
                    tile.setStatus("revealed");
                }
            });
        });
    }

    private revealFlagResults(): void {
        console.log(`[Game] revealFlagResults() called.`);
        this.board.grid.forEach(row => {
            row.forEach(tile => {
                if (tile.status === "flagged" && !tile.isBomb) {
                    console.log(`[Game] Wrong flag detected at (${tile.row}, ${tile.col}). Marking as wrong-flag.`);
                    tile.setStatus("wrong-flag");
                }
            });
        });
    }

    public toggleFlag(row: number, col: number): void {
        console.log(`[Game] toggleFlag() called on (${row}, ${col})`);
        this.assertPlaying();
        this.board.toggleFlag(row, col);
    }

    public getTile(row: number, col: number): Tile {
        return this.board.getTile(row, col);
    }

    public getStatus(): GameStatus {
        console.log(`[Game] getStatus() called: ${this.status}`);
        return this.status;
    }

    public getBoard(): Board {
        console.log(`[Game] getBoard() called`);
        return this.board;
    }

    private assertPlaying(): void {
        if (this.status !== "playing") {
            console.error(`[Game] assertPlaying failed. Current status: ${this.status}`);
            throw new Error(`Cannot modify board state; game is already ${this.status}`);
        }
    }

    private assertHidden(tile: Tile): void {
        if (tile.status !== "hidden") {
            console.error(`[Game] assertHidden failed on tile (${tile.row}, ${tile.col}). Status: ${tile.status}`);
            throw new Error(`Cannot reveal tile at (${tile.row}, ${tile.col}); current status is '${tile.status}'`);
        }
    }
}
