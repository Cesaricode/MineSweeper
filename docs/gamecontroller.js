import { GameUI } from "./ui.js";
import { themes } from "./themes.js";
export class GameController {
    constructor(rootElementId) {
        this.rootElementId = rootElementId;
        this._currentGameUI = null;
        this._currentThemeKey = "minesweeper";
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
                this.startGameFromSettings();
            });
        }
        const modeSelect = document.getElementById("game-mode");
        const colorModeSelect = document.getElementById('theme-mode');
        if (modeSelect && colorModeSelect) {
            modeSelect.addEventListener("change", (e) => {
                const selectedMode = e.target.value;
                if (selectedMode in themes) {
                    this._currentThemeKey = selectedMode;
                    this.applyThemeConfig();
                }
                else {
                    console.warn(`Unknown game mode: ${selectedMode}`);
                }
            });
            colorModeSelect.addEventListener('change', () => {
                document.documentElement.setAttribute('data-theme', colorModeSelect.value);
            });
        }
    }
    startGameFromSettings() {
        if (this._currentGameUI) {
            this._currentGameUI.destroy();
        }
        const rows = Number(document.getElementById("rows").value);
        const cols = Number(document.getElementById("cols").value);
        const difficulty = document.getElementById("difficulty").value;
        this._currentGameUI = new GameUI(this.rootElementId, rows, cols, difficulty);
        this._currentGameUI.renderBoard();
        this.applyThemeConfig();
    }
    applyThemeConfig() {
        const gameTitleElement = document.getElementById("game-title");
        const bombCounterElement = document.getElementById("bomb-counter");
        if (!this._currentGameUI || !gameTitleElement || !bombCounterElement) {
            return;
        }
        const currentTheme = themes[this._currentThemeKey];
        document.title = currentTheme.title;
        gameTitleElement.textContent = currentTheme.title;
        bombCounterElement.innerHTML = `${currentTheme.bombName}: <span id="bomb-count">${this._currentGameUI.getGame().board.bombCount}</span>`;
        this._currentGameUI.setBombIcon(currentTheme.icon);
        this._currentGameUI.setBombCountElement();
        this.applyColorConfig(currentTheme.colors);
    }
    applyColorConfig(colors) {
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
    }
}
