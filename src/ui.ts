import { Game, GameStatus } from "./game.js";
import { Tile } from "./tile.js";

export class GameUI {

    private _game: Game;
    private _boardElement!: HTMLElement;
    private _bombCountElement!: HTMLElement;
    private _timerElement!: HTMLElement;
    private _timerIntervalId: number | null = null;
    private _startTime: number = 0;
    private _elapsedTime: number = 0;
    private _timerRunning: boolean = false;
    private _bombIcon: string = "💣";
    private _tileListeners: Map<string, {
        click: EventListener;
        contextmenu: EventListener;
        mousedown?: EventListener;
        mouseup?: EventListener;
        mouseleave?: EventListener;
    }> = new Map();


    constructor(boardElementId: string, rows: number, cols: number, difficulty: string) {
        this._game = new Game(rows, cols, difficulty);
        this.setBoardElement(boardElementId);
        this.setBombCountElement();
        this.setTimerElement();
        this.updateBombCount();
    }

    private setTimerElement(): void {
        const element: HTMLElement | null = document.getElementById("time");
        if (!element) throw new Error("Timer element not found.");
        this._timerElement = element;
    }

    private setBoardElement(boardElementId: string,): void {
        const element: HTMLElement | null = document.getElementById(boardElementId);
        if (!element) throw new Error("Board element not found.");
        this._boardElement = element;
    }

    public setBombCountElement(): void {
        const bombCounter: HTMLElement | null = document.getElementById("bomb-count");
        if (!bombCounter) throw new Error("Bomb counter element not found.");
        this._bombCountElement = bombCounter;
    }

    private updateBombCount(): void {
        this._bombCountElement.textContent = (this._game.board.bombCount - this._game.board.flagCount).toString();
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

    private stopTimer(): void {
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

    public renderBoard(): void {
        this.clearTileEventListeners();
        this.prepareBoardElement(this._boardElement);
        this.updateBombCount();

        for (let row = 0; row < this._game.rows; row++) {
            for (let col = 0; col < this._game.cols; col++) {
                const tile: Tile = this._game.getTile(row, col);
                const tileElement: HTMLElement = this.createTileElement(tile, row, col);
                this.attachTileEventListeners(tileElement, tile, row, col, this._boardElement);
                this._boardElement.appendChild(tileElement);
            }
        }

        this.checkGameStatus();
    }

    private prepareBoardElement(boardElement: HTMLElement): void {
        boardElement.innerHTML = "";
        boardElement.style.gridTemplateColumns = `repeat(${this._game.cols}, 30px)`;
    }

    private createTileElement(tile: Tile, row: number, col: number): HTMLElement {
        const tileElement: HTMLElement = document.createElement("div");
        tileElement.className = "tile";
        tileElement.dataset.row = row.toString();
        tileElement.dataset.col = col.toString();

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

        return tileElement;
    }

    private attachTileEventListeners(tileElement: HTMLElement, tile: Tile, row: number, col: number, boardEl: HTMLElement): void {

        const onClick: EventListener = (e: Event): void => {
            try {
                if (!this._timerRunning && this._game.status === "playing") {
                    this.startTimer();
                }
                this._game.reveal(row, col);
                this.renderBoard();
            } catch (err) {
                alert((err as Error).message);
            }
        };

        const onContextMenu: EventListener = (e: Event): void => {
            e.preventDefault();
            try {
                this._game.toggleFlag(row, col);
                this.renderBoard();
            } catch (err) {
                alert((err as Error).message);
            }
        };

        const onMouseDown: EventListener | undefined =
            tile.status === "revealed" && tile.adjacentBombCount > 0
                ? (e: Event): void => this.handleHighlightNeighbors(e as MouseEvent, tile, boardEl)
                : undefined;

        const onMouseUp: EventListener | undefined =
            tile.status === "revealed" && tile.adjacentBombCount > 0
                ? (): void => this.clearHighlights()
                : undefined;

        const onMouseLeave: EventListener | undefined =
            tile.status === "revealed" && tile.adjacentBombCount > 0
                ? (): void => this.clearHighlights()
                : undefined;

        this._tileListeners.set(`${row},${col}`, {
            click: onClick,
            contextmenu: onContextMenu,
            mousedown: onMouseDown,
            mouseup: onMouseUp,
            mouseleave: onMouseLeave,
        });

        tileElement.addEventListener("click", onClick);
        tileElement.addEventListener("contextmenu", onContextMenu);

        if (onMouseDown) tileElement.addEventListener("mousedown", onMouseDown);
        if (onMouseUp) tileElement.addEventListener("mouseup", onMouseUp);
        if (onMouseLeave) tileElement.addEventListener("mouseleave", onMouseLeave);
    }

    private clearTileEventListeners(): void {
        for (const [key, listeners] of this._tileListeners.entries()) {
            const [rowStr, colStr]: string[] = key.split(",");
            const row: number = parseInt(rowStr, 10);
            const col: number = parseInt(colStr, 10);

            const tileElement: HTMLElement | null = this._boardElement.querySelector(
                `.tile[data-row="${row}"][data-col="${col}"]`
            );

            if (!tileElement) continue;
            tileElement.removeEventListener("click", listeners.click);
            tileElement.removeEventListener("contextmenu", listeners.contextmenu);

            if (listeners.mousedown)
                tileElement.removeEventListener("mousedown", listeners.mousedown);
            if (listeners.mouseup)
                tileElement.removeEventListener("mouseup", listeners.mouseup);
            if (listeners.mouseleave)
                tileElement.removeEventListener("mouseleave", listeners.mouseleave);
        }

        this._tileListeners.clear();
    }

    private handleHighlightNeighbors(e: MouseEvent, tile: Tile, boardEl: HTMLElement): void {
        if (e.button !== 0) return;

        const neighbors: Tile[] = this._game.getNeighbors(tile);

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

    private checkGameStatus(): void {
        const status: GameStatus = this._game.status;
        if (status !== "playing") {
            this.stopTimer();
            setTimeout(() => alert(`You ${status}!`), 100);
            this.clearTileEventListeners();
        }
    }

    public setBombIcon(icon: string) {
        this._bombIcon = icon;
    }

    public destroy(): void {
        this.clearTileEventListeners();
        this.resetTimer();
        this._boardElement.innerHTML = "";
    }

    public getGame(): Game {
        return this._game;
    }
}