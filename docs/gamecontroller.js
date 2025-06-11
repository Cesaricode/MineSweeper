import { themes } from "./themes.js";
import { Game } from "./game.js";
import { ThemeManager } from "./thememanager.js";
import { UIRenderer } from "./uirenderer.js";
import { SoundManager } from "./soundmanager.js";
export class GameController {
    constructor() {
        this._game = null;
        this._currentThemeKey = "minesweeper";
        this.handleTileRevealed = (e) => {
            this._soundManager.playTileClick();
            const detail = e.detail;
            if (detail && typeof detail.row === "number" && typeof detail.col === "number") {
                this._ui.updateTile(this._game, detail.row, detail.col);
            }
            else {
                this._ui.renderBoard(this._game);
            }
            this._ui.updateBombCount(this._game);
            this.saveGame();
        };
        this.handleFloodTilesRevealed = (e) => {
            this._soundManager.playTileClick();
            const detail = e.detail;
            if (detail && Array.isArray(detail.tiles) && detail.tiles.length > 0) {
                detail.tiles.forEach(tile => {
                    this._ui.updateTile(this._game, tile.row, tile.col);
                });
            }
            else {
                this._ui.renderBoard(this._game);
            }
            this._ui.updateBombCount(this._game);
            this.saveGame();
        };
        this.handleFlagToggled = (e) => {
            this._soundManager.playFlag();
            const detail = e.detail;
            if (detail && typeof detail.row === "number" && typeof detail.col === "number") {
                this._ui.updateTile(this._game, detail.row, detail.col);
            }
            else {
                this._ui.renderBoard(this._game);
            }
            this._ui.updateBombCount(this._game);
            this.saveGame();
        };
        this.handleGameWon = () => {
            this._soundManager.playVictory();
            this._ui.endGame(this._game);
            this._ui.showGameOverScreen("You won!");
            this.deleteSaveGame();
        };
        this.handleGameLost = () => {
            this._soundManager.playBomb();
            this._ui.endGame(this._game);
            this._ui.showGameOverScreen("You lost!");
            this.deleteSaveGame();
        };
        this._ui = new UIRenderer();
        this._themeManager = new ThemeManager();
        this._soundManager = new SoundManager();
        this.setupUICallbacks();
    }
    init() {
        this.bindEvents();
        this.bindSoundToggle();
        this.startGameFromSettings();
        this.tryRestoreSavedGame();
    }
    bindEvents() {
        this.bindSettingsForm();
        this.bindThemeSelect();
        this.bindDarkModeSelect();
        this.bindBeforeUnload();
    }
    bindSettingsForm() {
        const settingsForm = document.getElementById("settings-form");
        if (!settingsForm)
            return;
        settingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                this.startGameFromSettings();
                this.deleteSaveGame();
            }
            catch (err) {
                alert(err.message);
            }
        });
    }
    bindThemeSelect() {
        const themeSelect = document.getElementById("theme-mode");
        if (!themeSelect)
            return;
        themeSelect.addEventListener("change", (e) => {
            try {
                const selectedMode = e.target.value;
                if (selectedMode in themes) {
                    this._currentThemeKey = selectedMode;
                    this.applyThemeConfig();
                }
                else {
                    throw new Error(`Unknown game mode: ${selectedMode}`);
                }
            }
            catch (err) {
                alert(err.message);
            }
        });
    }
    bindDarkModeSelect() {
        const darkModeSelect = document.getElementById("dark-mode");
        if (!darkModeSelect)
            return;
        darkModeSelect.addEventListener("change", () => {
            try {
                this._themeManager.toggleDarkMode();
            }
            catch (err) {
                alert(err.message);
            }
        });
    }
    bindBeforeUnload() {
        window.addEventListener("beforeunload", () => {
            this.saveGame();
        });
    }
    initializeSoundToggleButton(btn) {
        const saved = localStorage.getItem("minesweeper-sound-muted");
        if (saved !== null) {
            const muted = saved === "true";
            this._soundManager.setMuted(muted);
            btn.ariaPressed = muted ? "true" : "false";
            btn.textContent = muted ? "🔇" : "🔊";
        }
    }
    handleSoundToggleClick(btn) {
        btn.addEventListener("click", () => {
            const muted = !this._soundManager.muted;
            this._soundManager.setMuted(muted);
            btn.ariaPressed = muted ? "true" : "false";
            btn.textContent = muted ? "🔇" : "🔊";
            localStorage.setItem("minesweeper-sound-muted", muted ? "true" : "false");
        });
    }
    bindSoundToggle() {
        const btn = document.getElementById("sound-toggle");
        if (!btn)
            return;
        this.initializeSoundToggleButton(btn);
        this.handleSoundToggleClick(btn);
    }
    startGameFromSettings() {
        this._ui.reset();
        const rows = Number(document.getElementById("rows").value);
        const cols = Number(document.getElementById("cols").value);
        const difficulty = document.getElementById("difficulty").value;
        this._game = new Game(rows, cols, difficulty);
        this.setGameEventListeners();
        this.applyThemeConfig();
        this._ui.setBoardEventHandlers(this._game);
        this._ui.renderBoard(this._game);
        this._ui.updateBombCount(this._game);
    }
    setGameEventListeners() {
        if (!this._game)
            throw new Error("Cannot set game event listeners - missing game");
        this._game.addEventListener("tileRevealed", this.handleTileRevealed);
        this._game.addEventListener("floodTilesRevealed", this.handleFloodTilesRevealed);
        this._game.addEventListener("flagToggled", this.handleFlagToggled);
        this._game.addEventListener("gameWon", this.handleGameWon);
        this._game.addEventListener("gameLost", this.handleGameLost);
    }
    applyThemeConfig() {
        if (!this._game)
            return;
        this._themeManager.setTheme(this._currentThemeKey);
        this._themeManager.applyTheme(this._game.board.bombCount);
        this._ui.setBombIcon(this._themeManager.theme.icon);
        this._ui.setBombCountElement();
    }
    setupUICallbacks() {
        this._ui.onRestartClicked(() => {
            this._ui.hideGameOverScreen();
            this.startGameFromSettings();
        });
        this._ui.onCloseClicked(() => {
            this._ui.hideGameOverScreen();
        });
    }
    saveGame() {
        if (!this._game || this._game.status !== "playing" || !this._game.board.bombsDeployed)
            return;
        const elapsedTime = this._ui.elapsedTime + 1000;
        const state = {
            rows: this._game.board.rows,
            cols: this._game.board.cols,
            difficulty: this._game.difficulty,
            board: this._game.board.grid.map(row => row.map(tile => ({
                status: tile.status,
                isBomb: tile.isBomb(),
                adjacentBombCount: tile.adjacentBombCount
            }))),
            elapsedTime: elapsedTime,
            status: this._game.status,
            tilesToReveal: this._game.tilesToReveal
        };
        localStorage.setItem("minesweeper-save", JSON.stringify(state));
    }
    loadGame() {
        const data = localStorage.getItem("minesweeper-save");
        if (!data)
            return null;
        try {
            return JSON.parse(data);
        }
        catch (_a) {
            return null;
        }
    }
    restoreSaveGame(state) {
        const game = new Game(state.rows, state.cols, state.difficulty);
        game.restoreBoardState(state);
        this._game = game;
        this.setGameEventListeners();
        this.applyThemeConfig();
        this._ui.setElapsedTime(state.elapsedTime);
        this._ui.startTimer();
        this._ui.setBoardEventHandlers(this._game);
        this._ui.renderBoard(this._game);
        this._ui.updateBombCount(this._game);
    }
    deleteSaveGame() {
        localStorage.removeItem("minesweeper-save");
    }
    tryRestoreSavedGame() {
        const saved = this.loadGame();
        if (saved) {
            this.restoreSaveGame(saved);
        }
    }
}
