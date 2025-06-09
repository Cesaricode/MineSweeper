export class UIRenderer {
    constructor() {
        this._timerIntervalId = null;
        this._startTime = 0;
        this._elapsedTime = 0;
        this._timerRunning = false;
        this._bombIcon = "💣";
        this._tileListeners = new Map();
        this.setBoardElement();
        this.setBombCountElement();
        this.setTimerElement();
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
    renderBoard(game) {
        this.clearTileEventListeners();
        this.prepareBoardElement(this._boardElement, game);
        this.updateBombCount(game);
        for (let row = 0; row < game.rows; row++) {
            for (let col = 0; col < game.cols; col++) {
                const tile = game.getTile(row, col);
                const tileElement = this.createTileElement(tile, row, col);
                this.attachTileEventListeners(tileElement, tile, row, col, this._boardElement, game);
                this._boardElement.appendChild(tileElement);
            }
        }
        this.checkGameStatus(game);
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
    attachTileEventListeners(tileElement, tile, row, col, boardEl, game) {
        const onClick = (e) => {
            try {
                if (!this._timerRunning && game.status === "playing") {
                    this.startTimer();
                }
                game.reveal(row, col);
                this.renderBoard(game);
            }
            catch (err) {
                alert(err.message);
            }
        };
        const onContextMenu = (e) => {
            e.preventDefault();
            try {
                game.toggleFlag(row, col);
                this.renderBoard(game);
            }
            catch (err) {
                alert(err.message);
            }
        };
        const onMouseDown = tile.status === "revealed" && tile.adjacentBombCount > 0
            ? (e) => this.handleHighlightNeighbors(e, tile, boardEl, game)
            : undefined;
        const onMouseUp = tile.status === "revealed" && tile.adjacentBombCount > 0
            ? () => this.clearHighlights()
            : undefined;
        const onMouseLeave = tile.status === "revealed" && tile.adjacentBombCount > 0
            ? () => this.clearHighlights()
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
        if (onMouseDown)
            tileElement.addEventListener("mousedown", onMouseDown);
        if (onMouseUp)
            tileElement.addEventListener("mouseup", onMouseUp);
        if (onMouseLeave)
            tileElement.addEventListener("mouseleave", onMouseLeave);
    }
    clearTileEventListeners() {
        for (const [key, listeners] of this._tileListeners.entries()) {
            const [rowStr, colStr] = key.split(",");
            const row = parseInt(rowStr, 10);
            const col = parseInt(colStr, 10);
            const tileElement = this._boardElement.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
            if (!tileElement)
                continue;
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
    checkGameStatus(game) {
        const status = game.status;
        if (status !== "playing") {
            this.stopTimer();
            setTimeout(() => alert(`You ${status}!`), 100);
            this.clearTileEventListeners();
        }
    }
    setBombIcon(icon) {
        this._bombIcon = icon;
    }
    reset() {
        this.clearTileEventListeners();
        this.resetTimer();
        this._boardElement.innerHTML = "";
    }
}
