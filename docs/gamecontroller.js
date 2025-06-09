import { themes } from "./themes.js";
import { Game } from "./game.js";
import { ThemeManager } from "./thememanager.js";
import { UIRenderer } from "./uirenderer.js";
import { SoundManager } from "./soundmanager.js";
export class GameController {
    constructor() {
        this._game = null;
        this._currentThemeKey = "minesweeper";
        this._ui = new UIRenderer();
        this._themeManager = new ThemeManager();
        this._soundManager = new SoundManager();
        this.setupUICallbacks();
    }
    init() {
        this.bindEvents();
        this.bindSoundToggle();
        this.startGameFromSettings();
    }
    bindEvents() {
        this.bindSettingsForm();
        this.bindThemeSelectors();
    }
    bindSettingsForm() {
        const settingsForm = document.getElementById("settings-form");
        if (!settingsForm)
            return;
        settingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                this.startGameFromSettings();
            }
            catch (err) {
                alert(err.message);
            }
        });
    }
    bindThemeSelectors() {
        const themeSelect = document.getElementById("theme-mode");
        const darkModeSelect = document.getElementById("dark-mode");
        if (!themeSelect || !darkModeSelect)
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
        darkModeSelect.addEventListener("change", () => {
            try {
                this._themeManager.toggleDarkMode();
            }
            catch (err) {
                alert(err.message);
            }
        });
    }
    bindSoundToggle() {
        const btn = document.getElementById("sound-toggle");
        if (!btn)
            return;
        const saved = localStorage.getItem("minesweeper-sound-muted");
        if (saved !== null) {
            const muted = saved === "true";
            this._soundManager.setMuted(muted);
            btn.ariaPressed = muted ? "true" : "false";
            btn.textContent = muted ? "🔇" : "🔊";
        }
        btn.addEventListener("click", () => {
            const muted = !this._soundManager.muted;
            this._soundManager.setMuted(muted);
            btn.ariaPressed = muted ? "true" : "false";
            btn.textContent = muted ? "🔇" : "🔊";
            localStorage.setItem("minesweeper-sound-muted", muted ? "true" : "false");
        });
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
        this._game.addEventListener("tileRevealed", (e) => {
            this._soundManager.playTileClick();
            const detail = e.detail;
            if (detail && typeof detail.row === "number" && typeof detail.col === "number") {
                this._ui.updateTile(this._game, detail.row, detail.col);
            }
            else {
                this._ui.renderBoard(this._game);
            }
            this._ui.updateBombCount(this._game);
        });
        this._game.addEventListener("flagToggled", (e) => {
            this._soundManager.playFlag();
            const detail = e.detail;
            if (detail && typeof detail.row === "number" && typeof detail.col === "number") {
                this._ui.updateTile(this._game, detail.row, detail.col);
            }
            else {
                this._ui.renderBoard(this._game);
            }
            this._ui.updateBombCount(this._game);
        });
        this._game.addEventListener("gameWon", () => {
            this._soundManager.playVictory();
            this._ui.endGame(this._game);
            this._ui.showGameOverScreen("You won!");
        });
        this._game.addEventListener("gameLost", () => {
            this._soundManager.playBomb();
            this._ui.endGame(this._game);
            this._ui.showGameOverScreen("You lost!");
        });
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
}
