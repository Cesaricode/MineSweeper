import { ThemeConfig, ThemeKey, themes } from "./themes.js";

export class ThemeManager {
    private _currentTheme: ThemeConfig;
    private _darkMode: boolean = true;

    constructor(theme?: ThemeKey) {
        this._currentTheme = theme ? themes[theme] : themes["minesweeper"];
    }

    public setTheme(theme: ThemeKey): void {
        if (themes[theme]) {
            this._currentTheme = themes[theme];
            this.applyTheme();
        } else throw new Error(`Unknown theme: ${theme}`);
    }

    public get theme(): ThemeConfig {
        return this._currentTheme;
    }

    public toggleDarkMode(): void {
        this._darkMode = !this._darkMode;
        this.applyDarkMode();
    }

    public get darkMode(): boolean {
        return this._darkMode;
    }

    public applyTheme(bombCount?: number): void {
        document.title = this._currentTheme.title;

        const gameTitleElement: HTMLElement | null = document.getElementById("game-title");
        if (gameTitleElement) {
            gameTitleElement.textContent = this._currentTheme.title;
        }
        const bombCounterElement: HTMLElement | null = document.getElementById("bomb-counter");
        if (bombCounterElement && bombCount !== undefined) {
            bombCounterElement.innerHTML = `${this._currentTheme.bombName}: <span id="bomb-count">${bombCount}</span>`;
        }

        this.applyColorConfig(this._currentTheme.colors);
    }

    private applyDarkMode(): void {
        document.documentElement.setAttribute('data-theme', this._darkMode ? "dark" : "light");
    }

    private applyColorConfig(colors: Record<string, string>): void {
        const root: HTMLElement = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
    }
}