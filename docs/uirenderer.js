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
        this._pressedTile = null;
        this._pressedRightTile = null;
        this._cancelTimerId = null;
        this._cancelThreshold = 150;
        this._actionCanceled = false;
        this._longPressTimeout = null;
        this._longPressTriggered = false;
        this._longPressDuration = 400;
        this._touchStartPos = null;
        this._touchMoveThreshold = 10;
        this.handleTileTouchStart = (game) => (e) => {
            e.preventDefault();
            if (e.touches.length !== 1)
                return;
            const touch = e.touches[0];
            this._touchStartPos = { x: touch.clientX, y: touch.clientY };
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!target || !target.classList.contains("tile"))
                return;
            const row = Number(target.dataset.row);
            const col = Number(target.dataset.col);
            if (isNaN(row) || isNaN(col))
                return;
            this._pressedTile = { row, col, time: Date.now() };
            target.classList.add("pressed");
            this._longPressTriggered = false;
            this._longPressTimeout = window.setTimeout(() => {
                this._longPressTriggered = true;
                target.classList.remove("pressed");
                game.toggleFlag(row, col);
            }, this._longPressDuration);
        };
        this.handleTileTouchEnd = (game) => (e) => {
            if (this._longPressTimeout) {
                clearTimeout(this._longPressTimeout);
                this._longPressTimeout = null;
            }
            if (!this._pressedTile)
                return;
            const { row, col } = this._pressedTile;
            this._pressedTile = null;
            document.querySelectorAll(".tile.pressed").forEach(el => el.classList.remove("pressed"));
            if (this._longPressTriggered) {
                return;
            }
            if (!this._timerRunning)
                this.startTimer();
            game.reveal(row, col);
            this._touchStartPos = null;
        };
        this.handleTileTouchMove = (e) => {
            if (!this._touchStartPos)
                return;
            const touch = e.touches[0];
            const dx = touch.clientX - this._touchStartPos.x;
            const dy = touch.clientY - this._touchStartPos.y;
            if (Math.abs(dx) > this._touchMoveThreshold || Math.abs(dy) > this._touchMoveThreshold) {
                if (this._longPressTimeout) {
                    clearTimeout(this._longPressTimeout);
                    this._longPressTimeout = null;
                }
                this._pressedTile = null;
                document.querySelectorAll(".tile.pressed").forEach(el => el.classList.remove("pressed"));
            }
        };
        this.handleTileTouchContextMenu = (e) => {
            const target = e.target;
            if (target.classList.contains("tile")) {
                e.preventDefault();
            }
        };
        this.handleTilePointerDown = (game) => (e) => {
            if (e.button !== 0)
                return;
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
            this._pressedTile = { row, col, time: Date.now() };
            if (tile.status === "hidden") {
                target.classList.add("pressed");
            }
        };
        this.handleTilePointerUp = (game) => (e) => {
            if (e.button !== 0)
                return;
            if (!this._pressedTile)
                return;
            const { row, col, time } = this._pressedTile;
            const now = Date.now();
            const target = e.target;
            this._pressedTile = null;
            if (this._cancelTimerId) {
                clearTimeout(this._cancelTimerId);
                this._cancelTimerId = null;
            }
            document.querySelectorAll(".tile.pressed").forEach(el => el.classList.remove("pressed"));
            const isSameTile = target.classList.contains("tile") &&
                Number(target.dataset.row) === row &&
                Number(target.dataset.col) === col;
            const withinThreshold = (now - time) < this._cancelThreshold;
            if ((isSameTile || withinThreshold) && !this._actionCanceled) {
                if (!this._timerRunning)
                    this.startTimer();
                game.reveal(row, col);
            }
            this.clearHighlights();
        };
        this.handleTilePointerLeave = (e) => {
            if (!this._pressedTile)
                return;
            const leftElement = e.target;
            if (!leftElement.classList.contains("tile"))
                return;
            this._cancelTimerId = window.setTimeout(() => {
                this._actionCanceled = true;
                document.querySelectorAll('.tile.pressed').forEach(el => el.classList.remove('pressed'));
            }, this._cancelThreshold);
        };
        this.handleTilePointerEnter = (e) => {
            if (!this._pressedTile)
                return;
            const target = e.target;
            const { row, col } = this._pressedTile;
            if (target.classList.contains("tile") &&
                Number(target.dataset.row) === row &&
                Number(target.dataset.col) === col) {
                if (this._cancelTimerId) {
                    clearTimeout(this._cancelTimerId);
                    this._cancelTimerId = null;
                }
                this._actionCanceled = false;
                target.classList.add("pressed");
            }
        };
        this.handleTileRightPointerDown = (e) => {
            if (e.button !== 2)
                return;
            const target = e.target;
            if (!target.classList.contains("tile"))
                return;
            const row = Number(target.dataset.row);
            const col = Number(target.dataset.col);
            if (isNaN(row) || isNaN(col))
                return;
            this._pressedRightTile = { row, col, time: Date.now() };
            target.classList.add("flag-pressed");
        };
        this.handleTileRightPointerUp = (game) => (e) => {
            if (e.button !== 2)
                return;
            if (!this._pressedRightTile)
                return;
            const { row, col, time } = this._pressedRightTile;
            this._pressedRightTile = null;
            document.querySelectorAll('.tile.flag-pressed').forEach(el => el.classList.remove('flag-pressed'));
            const target = e.target;
            const isSameTile = target.classList.contains("tile") &&
                Number(target.dataset.row) === row &&
                Number(target.dataset.col) === col;
            const withinThreshold = (Date.now() - time) < this._cancelThreshold;
            if (isSameTile || withinThreshold) {
                if (game.status !== "playing")
                    return;
                if (!this._timerRunning)
                    this.startTimer();
                try {
                    game.toggleFlag(row, col);
                }
                catch (err) {
                    alert(err.message);
                }
            }
            this.clearHighlights();
        };
        this.handleTileContextMenu = (e) => {
            const target = e.target;
            if (target.classList.contains("tile")) {
                e.preventDefault();
            }
        };
        this.handleBoardMouseLeave = debounce((e) => {
            this.clearHighlights();
            this.clearPressed();
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
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            this._boardElement.addEventListener("touchstart", this.handleTileTouchStart(game), { passive: false });
            this._boardElement.addEventListener("touchend", this.handleTileTouchEnd(game), { passive: false });
            this._boardElement.addEventListener("touchmove", this.handleTileTouchMove, { passive: false });
            this._boardElement.addEventListener("contextmenu", this.handleTileTouchContextMenu);
        }
        else {
            this._boardElement.addEventListener("pointerdown", this.handleTilePointerDown(game));
            this._boardElement.addEventListener("pointerup", this.handleTilePointerUp(game));
            this._boardElement.addEventListener("pointerdown", this.handleTileRightPointerDown);
            this._boardElement.addEventListener("pointerup", this.handleTileRightPointerUp(game));
            this._boardElement.addEventListener("pointerleave", this.handleTilePointerLeave);
            this._boardElement.addEventListener("pointerenter", this.handleTilePointerEnter);
            this._boardElement.addEventListener("mouseleave", this.handleBoardMouseLeave);
            this._boardElement.addEventListener("contextmenu", this.handleTileContextMenu);
        }
    }
    clearPressed() {
        document.querySelectorAll(".tile.pressed").forEach(element => {
            element.classList.remove("pressed");
        });
        document.querySelectorAll(".tile.flag-pressed").forEach(element => {
            element.classList.remove("flag-pressed");
        });
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
        this.updateTimerElement();
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
        this.forcePendingTileUpdates(game);
        this.updateBombCount(game);
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
        const batchSize = 50;
        const processBatch = () => {
            var _a, _b;
            for (let i = 0; i < batchSize && this._pendingTileUpdates.length; i++) {
                const { row, col } = this._pendingTileUpdates.shift();
                const tile = game.getTile(row, col);
                const tileElement = (_b = (_a = this._tileElements) === null || _a === void 0 ? void 0 : _a[row]) === null || _b === void 0 ? void 0 : _b[col];
                if (tileElement) {
                    this.applyTileState(tileElement, tile);
                }
            }
            if (this._pendingTileUpdates.length) {
                requestAnimationFrame(processBatch);
            }
            else {
                this._rafId = null;
            }
        };
        processBatch();
    }
    forcePendingTileUpdates(game) {
        var _a, _b;
        while (this._pendingTileUpdates.length > 0) {
            const { row, col } = this._pendingTileUpdates.shift();
            const tile = game.getTile(row, col);
            const tileElement = (_b = (_a = this._tileElements) === null || _a === void 0 ? void 0 : _a[row]) === null || _b === void 0 ? void 0 : _b[col];
            if (tileElement) {
                this.applyTileState(tileElement, tile);
            }
        }
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
