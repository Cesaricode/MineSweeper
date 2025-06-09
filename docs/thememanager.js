import { themes } from "./themes.js";
export class ThemeManager {
    constructor(theme) {
        this._darkMode = true;
        this._currentTheme = theme ? themes[theme] : themes["minesweeper"];
    }
    setTheme(theme) {
        if (themes[theme]) {
            this._currentTheme = themes[theme];
            this.applyTheme();
        }
        else
            throw new Error(`Unknown theme: ${theme}`);
    }
    get theme() {
        return this._currentTheme;
    }
    toggleDarkMode() {
        this._darkMode = !this._darkMode;
        this.applyDarkMode();
    }
    get darkMode() {
        return this._darkMode;
    }
    applyTheme(bombCount) {
        document.title = this._currentTheme.title;
        const gameTitleElement = document.getElementById("game-title");
        if (gameTitleElement) {
            gameTitleElement.textContent = this._currentTheme.title;
        }
        const bombCounterElement = document.getElementById("bomb-counter");
        if (bombCounterElement && bombCount !== undefined) {
            bombCounterElement.innerHTML = `${this._currentTheme.bombName}: <span id="bomb-count">${bombCount}</span>`;
        }
        this.applyColorConfig(this._currentTheme.colors);
    }
    applyDarkMode() {
        document.documentElement.setAttribute('data-theme', this._darkMode ? "dark" : "light");
    }
    applyColorConfig(colors) {
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
    }
}
