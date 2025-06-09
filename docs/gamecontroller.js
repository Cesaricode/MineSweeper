import { themes } from "./themes.js";
import { Game } from "./game.js";
import { ThemeManager } from "./thememanager.js";
import { UIRenderer } from "./uirenderer.js";
export class GameController {
    constructor() {
        this._game = null;
        this._currentThemeKey = "minesweeper";
        this._themeManager = new ThemeManager();
        this._ui = new UIRenderer();
    }
    init() {
        this.bindEvents();
        this.startGameFromSettings();
    }
    bindEvents() {
        const settingsForm = document.getElementById("settings-form");
        if (settingsForm) {
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
        const themeSelect = document.getElementById("theme-mode");
        const darkModeSelect = document.getElementById('dark-mode');
        if (themeSelect && darkModeSelect) {
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
            darkModeSelect.addEventListener('change', () => {
                try {
                    this._themeManager.toggleDarkMode();
                }
                catch (err) {
                    alert(err.message);
                }
            });
        }
    }
    startGameFromSettings() {
        this._ui.reset();
        const rows = Number(document.getElementById("rows").value);
        const cols = Number(document.getElementById("cols").value);
        const difficulty = document.getElementById("difficulty").value;
        this._game = new Game(rows, cols, difficulty);
        this.applyThemeConfig();
        this._ui.renderBoard(this._game);
        this._ui.updateBombCount(this._game);
    }
    applyThemeConfig() {
        if (!this._game)
            return;
        this._themeManager.setTheme(this._currentThemeKey);
        this._themeManager.applyTheme(this._game.board.bombCount);
        this._ui.setBombIcon(this._themeManager.theme.icon);
        this._ui.setBombCountElement();
    }
}
