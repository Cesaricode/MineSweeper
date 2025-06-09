export class UIRenderer {
    constructor() {
        this._tileElements = [];
        this._timerIntervalId = null;
        this._startTime = 0;
        this._elapsedTime = 0;
        this._timerRunning = false;
        this._bombIcon = "💣";
        this.setBoardElement();
        this.setBombCountElement();
        this.setTimerElement();
    }
    setBoardEventHandlers(game) {
        this._boardElement.replaceWith(this._boardElement.cloneNode(true));
        this._boardElement = document.getElementById("board");
        this._boardElement.addEventListener("click", (e) => {
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
        });
        this._boardElement.addEventListener("contextmenu", (e) => {
            const target = e.target;
            if (!target.classList.contains("tile"))
                return;
            e.preventDefault();
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
        });
        this._boardElement.addEventListener("mousedown", (e) => {
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
        });
        this._boardElement.addEventListener("mouseup", (e) => {
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
        });
        this._boardElement.addEventListener("mouseleave", (e) => {
            this.clearHighlights();
        });
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
        this.prepareBoardElement(this._boardElement, game);
        this._tileElements = [];
        for (let row = 0; row < game.board.rows; row++) {
            const rowElements = [];
            for (let col = 0; col < game.board.cols; col++) {
                const tile = game.getTile(row, col);
                const tileElement = this.createTileElement(tile, row, col);
                this._boardElement.appendChild(tileElement);
                rowElements.push(tileElement);
            }
            this._tileElements.push(rowElements);
        }
    }
    updateTile(game, row, col) {
        var _a, _b;
        const tile = game.getTile(row, col);
        const tileElement = (_b = (_a = this._tileElements) === null || _a === void 0 ? void 0 : _a[row]) === null || _b === void 0 ? void 0 : _b[col];
        if (tileElement) {
            this.applyTileState(tileElement, tile);
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
    }
    renderEndBoard(game) {
        for (let row = 0; row < game.board.rows; row++) {
            for (let col = 0; col < game.board.cols; col++) {
                this.updateTile(game, row, col);
            }
        }
    }
    reset() {
        this.resetTimer();
        this._tileElements = [];
    }
}
