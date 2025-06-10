import { debounce } from "./util.js";
export class UIRenderer {
    constructor() {
        this._tileElements = [];
        this._timerIntervalId = null;
        this._startTime = 0;
        this._elapsedTime = 0;
        this._timerRunning = false;
        this._bombIcon = "💣";
        this._pendingTileUpdates = [];
        this._rafId = null;
        this.handleTileClick = (game) => debounce((e) => {
            const target = e.target;
            if (!target.classList.contains("tile"))
                return;
            const row = Number(target.dataset.row);
            const col = Number(target.dataset.col);
            if (isNaN(row) || isNaN(col))
                return;
            if (game.status !== "playing")
                return;
            if (!this._timerRunning)
                this.startTimer();
            try {
                game.reveal(row, col);
            }
            catch (err) {
                alert(err.message);
            }
        }, 100);
        this.handleTileRightClick = (game) => (e) => {
            const target = e.target;
            if (!target.classList.contains("tile"))
                return;
            e.preventDefault();
            debounce(() => {
                const row = Number(target.dataset.row);
                const col = Number(target.dataset.col);
                if (isNaN(row) || isNaN(col))
                    return;
                if (game.status !== "playing")
                    return;
                try {
                    game.toggleFlag(row, col);
                }
                catch (err) {
                    alert(err.message);
                }
            }, 100)();
        };
        this.handleTileMouseDown = (game) => debounce((e) => {
            const target = e.target;
            if (!target.classList.contains("tile"))
                return;
            const row = Number(target.dataset.row);
            const col = Number(target.dataset.col);
            if (isNaN(row) || isNaN(col))
                return;
            const tile = game.getTile(row, col);
            if (tile.status === "revealed" &&
                tile.adjacentBombCount > 0 &&
                e.button === 0) {
                this.handleHighlightNeighbors(e, tile, this._boardElement, game);
            }
        }, 100);
        this.handleTileMouseUp = (game) => debounce((e) => {
            const target = e.target;
            if (!target.classList.contains("tile"))
                return;
            const row = Number(target.dataset.row);
            const col = Number(target.dataset.col);
            if (isNaN(row) || isNaN(col))
                return;
            const tile = game.getTile(row, col);
            if (tile.status === "revealed" && tile.adjacentBombCount > 0) {
                this.clearHighlights();
            }
        }, 100);
        this.handleBoardMouseLeave = debounce((e) => {
            this.clearHighlights();
        }, 100);
        this.tileStateHandlers = {
            "hidden": (tileElement, tile) => this.applyHiddenState(tileElement),
            "revealed": (tileElement, tile) => this.applyRevealedState(tileElement, tile),
            "flagged": (tileElement, tile) => this.applyFlaggedState(tileElement),
            "wrong-flag": (tileElement, tile) => this.applyWrongFlagState(tileElement),
        };
        this.setBoardElement();
        this.setBombCountElement();
        this.setTimerElement();
        this.setGameOverScreenElements();
    }
    setBoardEventHandlers(game) {
        this._boardElement.replaceWith(this._boardElement.cloneNode(true));
        this._boardElement = document.getElementById("board");
        this._boardElement.addEventListener("click", this.handleTileClick(game));
        this._boardElement.addEventListener("contextmenu", this.handleTileRightClick(game));
        this._boardElement.addEventListener("mousedown", this.handleTileMouseDown(game));
        this._boardElement.addEventListener("mouseup", this.handleTileMouseUp(game));
        this._boardElement.addEventListener("mouseleave", this.handleBoardMouseLeave);
    }
    clearBoardEventHandlers() {
        var _a;
        const newBoard = this._boardElement.cloneNode(true);
        (_a = this._boardElement.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(newBoard, this._boardElement);
        this._boardElement = newBoard;
    }
    setTimerElement() {
        const element = document.getElementById("time");
        if (!element)
            throw new Error("Timer element not found.");
        this._timerElement = element;
    }
    setBoardElement() {
        const element = document.getElementById("board");
        if (!element)
            throw new Error("Board element not found.");
        this._boardElement = element;
    }
    setBombCountElement() {
        const bombCounter = document.getElementById("bomb-count");
        if (!bombCounter)
            throw new Error("Bomb counter element not found.");
        this._bombCountElement = bombCounter;
    }
    updateBombCount(game) {
        this._bombCountElement.textContent = (game.board.bombCount - game.board.flagCount).toString();
    }
    updateTimerElement() {
        const seconds = Math.floor(this._elapsedTime / 1000);
        this._timerElement.textContent = seconds.toString().padStart(3, '0');
    }
    startTimer() {
        if (this._timerRunning)
            return;
        this._startTime = Date.now() - this._elapsedTime;
        this._timerRunning = true;
        this._timerIntervalId = window.setInterval(() => {
            this._elapsedTime = Date.now() - this._startTime;
            this.updateTimerElement();
        }, 1000);
    }
    stopTimer() {
        if (this._timerIntervalId !== null) {
            window.clearInterval(this._timerIntervalId);
            this._timerIntervalId = null;
            this._timerRunning = false;
        }
    }
    resetTimer() {
        this.stopTimer();
        this._elapsedTime = 0;
        this.updateTimerElement();
    }
    setElapsedTime(time) {
        this._elapsedTime = time;
    }
    get elapsedTime() {
        return this._elapsedTime;
    }
    renderBoard(game) {
        this.prepareBoardElement(this._boardElement, game);
        this._tileElements = [];
        const fragment = document.createDocumentFragment();
        for (let row = 0; row < game.board.rows; row++) {
            const rowElements = [];
            for (let col = 0; col < game.board.cols; col++) {
                const tile = game.getTile(row, col);
                const tileElement = this.createTileElement(tile, row, col);
                fragment.appendChild(tileElement);
                rowElements.push(tileElement);
            }
            this._tileElements.push(rowElements);
        }
        this._boardElement.appendChild(fragment);
    }
    updateTile(game, row, col) {
        this._pendingTileUpdates.push({ row, col });
        if (this._rafId === null) {
            this._rafId = requestAnimationFrame(() => {
                var _a, _b;
                for (const { row, col } of this._pendingTileUpdates) {
                    const tile = game.getTile(row, col);
                    const tileElement = (_b = (_a = this._tileElements) === null || _a === void 0 ? void 0 : _a[row]) === null || _b === void 0 ? void 0 : _b[col];
                    if (tileElement) {
                        this.applyTileState(tileElement, tile);
                    }
                }
                this._pendingTileUpdates = [];
                this._rafId = null;
            });
        }
    }
    applyTileState(tileElement, tile) {
        var _a;
        const prevState = tileElement.dataset.state;
        const newState = tile.status;
        if (prevState === newState && tileElement.dataset.value === ((_a = tile.adjacentBombCount) === null || _a === void 0 ? void 0 : _a.toString())) {
            return;
        }
        tileElement.dataset.state = newState;
        tileElement.className = "tile";
        tileElement.textContent = "";
        tileElement.removeAttribute("data-value");
        const handler = this.tileStateHandlers[newState];
        if (handler) {
            handler(tileElement, tile);
        }
    }
    applyHiddenState(tileElement) {
        tileElement.classList.remove("revealed", "flagged", "wrong-flag");
        tileElement.textContent = "";
        tileElement.removeAttribute("data-value");
    }
    applyRevealedState(tileElement, tile) {
        tileElement.classList.add("revealed");
        tileElement.textContent = tile.isBomb() ? this._bombIcon :
            tile.adjacentBombCount ? tile.adjacentBombCount.toString() : "";
        tileElement.dataset.value = tile.adjacentBombCount.toString();
    }
    applyFlaggedState(tileElement) {
        tileElement.classList.add("flagged");
        tileElement.textContent = "🚩";
    }
    applyWrongFlagState(tileElement) {
        tileElement.classList.add("wrong-flag");
        tileElement.textContent = "❌";
    }
    prepareBoardElement(boardElement, game) {
        boardElement.innerHTML = "";
        boardElement.style.gridTemplateColumns = `repeat(${game.cols}, 30px)`;
    }
    createTileElement(tile, row, col) {
        const tileElement = document.createElement("div");
        tileElement.className = "tile";
        tileElement.dataset.row = row.toString();
        tileElement.dataset.col = col.toString();
        this.applyTileState(tileElement, tile);
        return tileElement;
    }
    handleHighlightNeighbors(e, tile, boardEl, game) {
        if (e.button !== 0)
            return;
        const neighbors = game.getNeighbors(tile);
        for (const neighbor of neighbors) {
            if (neighbor.status === "hidden") {
                const neighborElement = boardEl.querySelector(`.tile[data-row="${neighbor.row}"][data-col="${neighbor.col}"]`);
                if (neighborElement) {
                    neighborElement.classList.add("highlighted");
                }
                else {
                    console.warn(`[UI] Could not find element for neighbor at (${neighbor.row}, ${neighbor.col})`);
                }
            }
        }
    }
    clearHighlights() {
        document.querySelectorAll(".tile.highlighted").forEach(element => {
            element.classList.remove("highlighted");
        });
    }
    setBombIcon(icon) {
        this._bombIcon = icon;
    }
    endGame(game) {
        this.stopTimer();
        this.renderEndBoard(game);
        this.clearBoardEventHandlers();
    }
    renderEndBoard(game) {
        for (let row = 0; row < game.board.rows; row++) {
            for (let col = 0; col < game.board.cols; col++) {
                this.updateTile(game, row, col);
            }
        }
        this.flushPendingTileUpdates(game);
    }
    flushPendingTileUpdates(game) {
        var _a, _b;
        for (const { row, col } of this._pendingTileUpdates) {
            const tile = game.getTile(row, col);
            const tileElement = (_b = (_a = this._tileElements) === null || _a === void 0 ? void 0 : _a[row]) === null || _b === void 0 ? void 0 : _b[col];
            if (tileElement) {
                this.applyTileState(tileElement, tile);
            }
        }
        this._pendingTileUpdates = [];
        this._rafId = null;
    }
    setGameOverScreenElements() {
        const screen = document.getElementById("game-over-screen");
        const messageElem = document.getElementById("game-over-message");
        const restartButton = document.getElementById("restart-button");
        const closeButton = document.getElementById("close-game-over");
        if (!screen || !messageElem || !restartButton || !closeButton) {
            throw new Error("Game Over screen elements not found");
        }
        this._gameOverScreenElement = screen;
        this._gameOverMessageElement = messageElem;
        this._restartButtonElement = restartButton;
        this._closeButtonElement = closeButton;
    }
    showGameOverScreen(message) {
        this._gameOverMessageElement.textContent = message;
        this._gameOverScreenElement.classList.remove("hidden");
        this._gameOverScreenElement.classList.add("visible");
    }
    hideGameOverScreen() {
        this._gameOverScreenElement.classList.add("hidden");
        this._gameOverScreenElement.classList.remove("visible");
    }
    onRestartClicked(callback) {
        this._restartButtonElement.onclick = callback;
    }
    onCloseClicked(callback) {
        this._closeButtonElement.onclick = callback;
    }
    reset() {
        this.resetTimer();
        this._tileElements = [];
    }
}
