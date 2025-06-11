import { Game } from "./game.js";
import { Tile, TileStatus } from "./tile.js";
import { debounce } from "./util.js";

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
    private _pendingTileUpdates: { row: number, col: number; }[] = [];
    private _rafId: number | null = null;
    private _pressedTile: { row: number; col: number; time: number; } | null = null;
    private _pressedRightTile: { row: number, col: number, time: number; } | null = null;
    private _cancelTimerId: number | null = null;
    private _cancelThreshold = 150;
    private _actionCanceled = false;

    constructor() {
        this.setBoardElement();
        this.setBombCountElement();
        this.setTimerElement();
        this.setGameOverScreenElements();
    }

    public setBoardEventHandlers(game: Game): void {
        this._boardElement.replaceWith(this._boardElement.cloneNode(true));
        this._boardElement = document.getElementById("board")!;

        this._boardElement.addEventListener("pointerdown", this.handleTilePointerDown(game));
        this._boardElement.addEventListener("pointerup", this.handleTilePointerUp(game));
        this._boardElement.addEventListener("pointerdown", this.handleTileRightPointerDown);
        this._boardElement.addEventListener("pointerup", this.handleTileRightPointerUp(game));
        this._boardElement.addEventListener("pointerleave", this.handleTilePointerLeave);
        this._boardElement.addEventListener("pointerenter", this.handleTilePointerEnter);
        this._boardElement.addEventListener("mouseleave", this.handleBoardMouseLeave);
        this._boardElement.addEventListener("contextmenu", this.handleTileContextMenu);
    }

    private handleTilePointerDown = (game: Game) => (e: PointerEvent): void => {
        if (e.button !== 0) return;

        const target: HTMLElement = e.target as HTMLElement;
        if (!target.classList.contains("tile")) return;

        const row: number = Number(target.dataset.row);
        const col: number = Number(target.dataset.col);
        if (isNaN(row) || isNaN(col)) return;
        const tile: Tile = game.getTile(row, col);
        if (
            tile.status === "revealed" &&
            tile.adjacentBombCount > 0 &&
            e.button === 0
        ) {
            this.handleHighlightNeighbors(e, tile, this._boardElement, game);
        }
        this._pressedTile = { row, col, time: Date.now() };
        if (tile.status === "hidden") {
            target.classList.add("pressed");
        }
    };

    private handleTilePointerUp = (game: Game) => (e: PointerEvent): void => {
        if (e.button !== 0) return;
        if (!this._pressedTile) return;

        const { row, col, time } = this._pressedTile;
        const now: number = Date.now();
        const target: HTMLElement = e.target as HTMLElement;

        this._pressedTile = null;
        if (this._cancelTimerId) {
            clearTimeout(this._cancelTimerId);
            this._cancelTimerId = null;
        }

        document.querySelectorAll(".tile.pressed").forEach(el => el.classList.remove("pressed"));

        const isSameTile: boolean = target.classList.contains("tile") &&
            Number(target.dataset.row) === row &&
            Number(target.dataset.col) === col;

        const withinThreshold: boolean = (now - time) < this._cancelThreshold;

        if ((isSameTile || withinThreshold) && !this._actionCanceled) {
            if (!this._timerRunning) this.startTimer();
            game.reveal(row, col);
        }
        this.clearHighlights();
    };

    private handleTilePointerLeave = (e: PointerEvent): void => {
        if (!this._pressedTile) return;

        const leftElement: HTMLElement = e.target as HTMLElement;
        if (!leftElement.classList.contains("tile")) return;

        this._cancelTimerId = window.setTimeout(() => {
            this._actionCanceled = true;
            document.querySelectorAll('.tile.pressed').forEach(el => el.classList.remove('pressed'));
        }, this._cancelThreshold);
    };

    private handleTilePointerEnter = (e: PointerEvent): void => {
        if (!this._pressedTile) return;

        const target: HTMLElement = e.target as HTMLElement;
        const { row, col } = this._pressedTile;

        if (target.classList.contains("tile") &&
            Number(target.dataset.row) === row &&
            Number(target.dataset.col) === col
        ) {
            if (this._cancelTimerId) {
                clearTimeout(this._cancelTimerId);
                this._cancelTimerId = null;
            }

            this._actionCanceled = false;
            target.classList.add("pressed");
        }
    };

    private handleTileRightPointerDown = (e: PointerEvent): void => {
        if (e.button !== 2) return;

        const target: HTMLElement = e.target as HTMLElement;
        if (!target.classList.contains("tile")) return;

        const row: number = Number(target.dataset.row);
        const col: number = Number(target.dataset.col);
        if (isNaN(row) || isNaN(col)) return;

        this._pressedRightTile = { row, col, time: Date.now() };
        target.classList.add("flag-pressed");
    };

    private handleTileRightPointerUp = (game: Game) => (e: PointerEvent): void => {
        if (e.button !== 2) return;
        if (!this._pressedRightTile) return;

        const { row, col, time } = this._pressedRightTile;
        this._pressedRightTile = null;
        document.querySelectorAll('.tile.flag-pressed').forEach(el => el.classList.remove('flag-pressed'));

        const target: HTMLElement = e.target as HTMLElement;
        const isSameTile: boolean = target.classList.contains("tile") &&
            Number(target.dataset.row) === row &&
            Number(target.dataset.col) === col;

        const withinThreshold: boolean = (Date.now() - time) < this._cancelThreshold;

        if (isSameTile || withinThreshold) {
            if (game.status !== "playing") return;
            if (!this._timerRunning) this.startTimer();
            try {
                game.toggleFlag(row, col);
            } catch (err) {
                alert((err as Error).message);
            }
        }
        this.clearHighlights();
    };

    private handleTileContextMenu = (e: MouseEvent): void => {
        const target: HTMLElement = e.target as HTMLElement;
        if (target.classList.contains("tile")) {
            e.preventDefault();
        }
    };

    private handleBoardMouseLeave = debounce((e: MouseEvent): void => {
        this.clearHighlights();
        this.clearPressed();
    }, 100);

    private clearPressed(): void {
        document.querySelectorAll(".tile.pressed").forEach(element => {
            element.classList.remove("pressed");
        });
        document.querySelectorAll(".tile.flag-pressed").forEach(element => {
            element.classList.remove("flag-pressed");
        });
    }

    private clearBoardEventHandlers(): void {
        const newBoard: HTMLElement = this._boardElement.cloneNode(true) as HTMLElement;
        this._boardElement.parentNode?.replaceChild(newBoard, this._boardElement);
        this._boardElement = newBoard;
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

    public startTimer(): void {
        if (this._timerRunning) return;
        this.updateTimerElement();
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

    public setElapsedTime(time: number): void {
        this._elapsedTime = time;
    }

    public get elapsedTime(): number {
        return this._elapsedTime;
    }

    public renderBoard(game: Game): void {
        this.prepareBoardElement(this._boardElement, game);
        this._tileElements = [];
        const fragment: DocumentFragment = document.createDocumentFragment();

        for (let row = 0; row < game.board.rows; row++) {
            const rowElements: HTMLElement[] = [];
            for (let col = 0; col < game.board.cols; col++) {
                const tile: Tile = game.getTile(row, col);
                const tileElement: HTMLElement = this.createTileElement(tile, row, col);
                fragment.appendChild(tileElement);
                rowElements.push(tileElement);
            }
            this._tileElements.push(rowElements);
        }
        this._boardElement.appendChild(fragment);
    }

    public updateTile(game: Game, row: number, col: number): void {
        this._pendingTileUpdates.push({ row, col });
        if (this._rafId === null) {
            this._rafId = requestAnimationFrame(() => {
                for (const { row, col } of this._pendingTileUpdates) {
                    const tile: Tile = game.getTile(row, col);
                    const tileElement: HTMLElement = this._tileElements?.[row]?.[col];
                    if (tileElement) {
                        this.applyTileState(tileElement, tile);
                    }
                }
                this._pendingTileUpdates = [];
                this._rafId = null;
            });
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

        const handler: (tileElement: HTMLElement, tile: Tile) => void = this.tileStateHandlers[newState];
        if (handler) {
            handler(tileElement, tile);
        }
    }

    private tileStateHandlers: Record<TileStatus, (tileElement: HTMLElement, tile: Tile) => void> = {
        "hidden": (tileElement, tile): void => this.applyHiddenState(tileElement),
        "revealed": (tileElement, tile): void => this.applyRevealedState(tileElement, tile),
        "flagged": (tileElement, tile): void => this.applyFlaggedState(tileElement),
        "wrong-flag": (tileElement, tile): void => this.applyWrongFlagState(tileElement),
    };

    private applyHiddenState(tileElement: HTMLElement): void {
        tileElement.classList.remove("revealed", "flagged", "wrong-flag");
        tileElement.textContent = "";
        tileElement.removeAttribute("data-value");
    }

    private applyRevealedState(tileElement: HTMLElement, tile: Tile): void {
        tileElement.classList.add("revealed");
        tileElement.textContent = tile.isBomb() ? this._bombIcon :
            tile.adjacentBombCount ? tile.adjacentBombCount.toString() : "";
        tileElement.dataset.value = tile.adjacentBombCount.toString();
    }

    private applyFlaggedState(tileElement: HTMLElement): void {
        tileElement.classList.add("flagged");
        tileElement.textContent = "🚩";
    }

    private applyWrongFlagState(tileElement: HTMLElement): void {
        tileElement.classList.add("wrong-flag");
        tileElement.textContent = "❌";
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
        this.forcePendingTileUpdates(game);
        this.updateBombCount(game);
        this.clearBoardEventHandlers();
    }

    private renderEndBoard(game: Game): void {
        for (let row = 0; row < game.board.rows; row++) {
            for (let col = 0; col < game.board.cols; col++) {
                this.updateTile(game, row, col);
            }
        }
        this.flushPendingTileUpdates(game);
    }

    private flushPendingTileUpdates(game: Game): void {
        const batchSize: number = 50;
        const processBatch = () => {
            for (let i = 0; i < batchSize && this._pendingTileUpdates.length; i++) {
                const { row, col } = this._pendingTileUpdates.shift()!;
                const tile: Tile = game.getTile(row, col);
                const tileElement: HTMLElement = this._tileElements?.[row]?.[col];
                if (tileElement) {
                    this.applyTileState(tileElement, tile);
                }
            }
            if (this._pendingTileUpdates.length) {
                requestAnimationFrame(processBatch);
            } else {
                this._rafId = null;
            }
        };
        processBatch();
    }

    private forcePendingTileUpdates(game: Game): void {
        while (this._pendingTileUpdates.length > 0) {
            const { row, col } = this._pendingTileUpdates.shift()!;
            const tile: Tile = game.getTile(row, col);
            const tileElement: HTMLElement = this._tileElements?.[row]?.[col];
            if (tileElement) {
                this.applyTileState(tileElement, tile);
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