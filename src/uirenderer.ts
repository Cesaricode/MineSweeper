import { Game } from "./game.js";
import { Tile, TileStatus } from "./tile.js";

export class UIRenderer {

    private _boardElement!: HTMLElement;
    private _tileElements: HTMLElement[][] = [];
    private _bombCountElement!: HTMLElement;
    private _timerElement!: HTMLElement;
    private _gameOverScreenElement!: HTMLElement;
    private _gameOverMessageElement!: HTMLElement;
    private _restartButtonElement!: HTMLElement;
    private _closeButtonElement!: HTMLElement;
    private _timerIntervalId: number | null = null;
    private _startTime: number = 0;
    private _elapsedTime: number = 0;
    private _timerRunning: boolean = false;
    private _bombIcon: string = "💣";

    constructor() {
        this.setBoardElement();
        this.setBombCountElement();
        this.setTimerElement();
        this.setGameOverScreenElements();
    }

    public setBoardEventHandlers(game: Game) {
        this._boardElement.replaceWith(this._boardElement.cloneNode(true));
        this._boardElement = document.getElementById("board")!;

        this._boardElement.addEventListener("click", (e: MouseEvent) => {
            const target: HTMLElement = e.target as HTMLElement;
            if (!target.classList.contains("tile")) return;
            const row: number = Number(target.dataset.row);
            const col: number = Number(target.dataset.col);
            if (isNaN(row) || isNaN(col)) return;
            if (game.status !== "playing") return;
            if (!this._timerRunning) this.startTimer();
            try {
                game.reveal(row, col);
            } catch (err) {
                alert((err as Error).message);
            }
        });

        this._boardElement.addEventListener("contextmenu", (e: MouseEvent) => {
            const target: HTMLElement = e.target as HTMLElement;
            if (!target.classList.contains("tile")) return;
            e.preventDefault();
            const row: number = Number(target.dataset.row);
            const col: number = Number(target.dataset.col);
            if (isNaN(row) || isNaN(col)) return;
            if (game.status !== "playing") return;
            try {
                game.toggleFlag(row, col);
            } catch (err) {
                alert((err as Error).message);
            }
        });

        this._boardElement.addEventListener("mousedown", (e: MouseEvent) => {
            const target: HTMLElement = e.target as HTMLElement;
            if (!target.classList.contains("tile")) return;
            const row: number = Number(target.dataset.row);
            const col: number = Number(target.dataset.col);
            if (isNaN(row) || isNaN(col)) return;
            const tile = game.getTile(row, col);
            if (
                tile.status === "revealed" &&
                tile.adjacentBombCount > 0 &&
                e.button === 0
            ) {
                this.handleHighlightNeighbors(e, tile, this._boardElement, game);
            }
        });

        this._boardElement.addEventListener("mouseup", (e: MouseEvent) => {
            const target: HTMLElement = e.target as HTMLElement;
            if (!target.classList.contains("tile")) return;
            const row: number = Number(target.dataset.row);
            const col: number = Number(target.dataset.col);
            if (isNaN(row) || isNaN(col)) return;
            const tile: Tile = game.getTile(row, col);
            if (tile.status === "revealed" && tile.adjacentBombCount > 0) {
                this.clearHighlights();
            }
        });

        this._boardElement.addEventListener("mouseleave", (e: MouseEvent) => {
            this.clearHighlights();
        });
    }

    private setTimerElement(): void {
        const element: HTMLElement | null = document.getElementById("time");
        if (!element) throw new Error("Timer element not found.");
        this._timerElement = element;
    }

    private setBoardElement(): void {
        const element: HTMLElement | null = document.getElementById("board");
        if (!element) throw new Error("Board element not found.");
        this._boardElement = element;
    }

    public setBombCountElement(): void {
        const bombCounter: HTMLElement | null = document.getElementById("bomb-count");
        if (!bombCounter) throw new Error("Bomb counter element not found.");
        this._bombCountElement = bombCounter;
    }

    public updateBombCount(game: Game): void {
        this._bombCountElement.textContent = (game.board.bombCount - game.board.flagCount).toString();
    }

    private updateTimerElement(): void {
        const seconds: number = Math.floor(this._elapsedTime / 1000);
        this._timerElement.textContent = seconds.toString().padStart(3, '0');
    }

    private startTimer(): void {
        if (this._timerRunning) return;
        this._startTime = Date.now() - this._elapsedTime;
        this._timerRunning = true;

        this._timerIntervalId = window.setInterval(() => {
            this._elapsedTime = Date.now() - this._startTime;
            this.updateTimerElement();
        }, 1000);
    }

    public stopTimer(): void {
        if (this._timerIntervalId !== null) {
            window.clearInterval(this._timerIntervalId);
            this._timerIntervalId = null;
            this._timerRunning = false;
        }
    }

    private resetTimer(): void {
        this.stopTimer();
        this._elapsedTime = 0;
        this.updateTimerElement();
    }

    public renderBoard(game: Game): void {
        this.prepareBoardElement(this._boardElement, game);
        this._tileElements = [];

        for (let row = 0; row < game.board.rows; row++) {
            const rowElements: HTMLElement[] = [];
            for (let col = 0; col < game.board.cols; col++) {
                const tile: Tile = game.getTile(row, col);
                const tileElement: HTMLElement = this.createTileElement(tile, row, col);
                this._boardElement.appendChild(tileElement);
                rowElements.push(tileElement);
            }
            this._tileElements.push(rowElements);
        }
    }

    public updateTile(game: Game, row: number, col: number): void {
        const tile: Tile = game.getTile(row, col);
        const tileElement: HTMLElement = this._tileElements?.[row]?.[col];
        if (tileElement) {
            this.applyTileState(tileElement, tile);
        }
    }

    private applyTileState(tileElement: HTMLElement, tile: Tile): void {
        const prevState: string | undefined = tileElement.dataset.state;
        const newState: TileStatus = tile.status;

        if (prevState === newState && tileElement.dataset.value === tile.adjacentBombCount?.toString()) {
            return;
        }

        tileElement.dataset.state = newState;
        tileElement.className = "tile";
        tileElement.textContent = "";
        tileElement.removeAttribute("data-value");

        switch (tile.status) {
            case "revealed":
                tileElement.classList.add("revealed");
                tileElement.textContent = tile.isBomb() ? this._bombIcon :
                    tile.adjacentBombCount ? tile.adjacentBombCount.toString() : "";
                tileElement.dataset.value = tile.adjacentBombCount.toString();
                break;
            case "flagged":
                tileElement.classList.add("flagged");
                tileElement.textContent = "🚩";
                break;
            case "wrong-flag":
                tileElement.classList.add("wrong-flag");
                tileElement.textContent = "❌";
                break;
        }
    }

    private prepareBoardElement(boardElement: HTMLElement, game: Game): void {
        boardElement.innerHTML = "";
        boardElement.style.gridTemplateColumns = `repeat(${game.cols}, 30px)`;
    }

    private createTileElement(tile: Tile, row: number, col: number): HTMLElement {
        const tileElement: HTMLElement = document.createElement("div");
        tileElement.className = "tile";
        tileElement.dataset.row = row.toString();
        tileElement.dataset.col = col.toString();
        this.applyTileState(tileElement, tile);
        return tileElement;
    }

    private handleHighlightNeighbors(e: MouseEvent, tile: Tile, boardEl: HTMLElement, game: Game): void {
        if (e.button !== 0) return;

        const neighbors: Tile[] = game.getNeighbors(tile);

        for (const neighbor of neighbors) {
            if (neighbor.status === "hidden") {
                const neighborElement: HTMLElement = boardEl.querySelector(
                    `.tile[data-row="${neighbor.row}"][data-col="${neighbor.col}"]`
                ) as HTMLElement;

                if (neighborElement) {
                    neighborElement.classList.add("highlighted");
                } else {
                    console.warn(`[UI] Could not find element for neighbor at (${neighbor.row}, ${neighbor.col})`);
                }
            }
        }
    }

    private clearHighlights(): void {
        document.querySelectorAll(".tile.highlighted").forEach(element => {
            element.classList.remove("highlighted");
        });
    }

    public setBombIcon(icon: string) {
        this._bombIcon = icon;
    }

    public endGame(game: Game): void {
        this.stopTimer();
        this.renderEndBoard(game);
    }

    private renderEndBoard(game: Game): void {
        for (let row = 0; row < game.board.rows; row++) {
            for (let col = 0; col < game.board.cols; col++) {
                this.updateTile(game, row, col);
            }
        }
    }

    private setGameOverScreenElements(): void {
        const screen: HTMLElement | null = document.getElementById("game-over-screen");
        const messageElem: HTMLElement | null = document.getElementById("game-over-message");
        const restartButton: HTMLElement | null = document.getElementById("restart-button");
        const closeButton: HTMLElement | null = document.getElementById("close-game-over");

        if (!screen || !messageElem || !restartButton || !closeButton) {
            throw new Error("Game Over screen elements not found");
        }

        this._gameOverScreenElement = screen;
        this._gameOverMessageElement = messageElem;
        this._restartButtonElement = restartButton;
        this._closeButtonElement = closeButton;
    }

    public showGameOverScreen(message: string): void {
        this._gameOverMessageElement.textContent = message;
        this._gameOverScreenElement.classList.remove("hidden");
        this._gameOverScreenElement.classList.add("visible");
    }

    public hideGameOverScreen(): void {
        this._gameOverScreenElement.classList.add("hidden");
        this._gameOverScreenElement.classList.remove("visible");
    }

    public onRestartClicked(callback: () => void): void {
        this._restartButtonElement.onclick = callback;
    }

    public onCloseClicked(callback: () => void): void {
        this._closeButtonElement.onclick = callback;
    }

    public reset(): void {
        this.resetTimer();
        this._tileElements = [];
    }
}