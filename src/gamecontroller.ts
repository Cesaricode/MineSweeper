import { GameUI } from "./ui.js";
import { themes, ThemeKey, ThemeConfig } from "./themes.js";

export class GameController {
    private _currentGameUI: GameUI | null = null;
    private _currentThemeKey: ThemeKey = "minesweeper";

    constructor(private rootElementId: string) { }

    init(): void {
        this.bindEvents();
        this.startGameFromSettings();
    }

    private bindEvents(): void {
        const settingsForm: HTMLElement | null = document.getElementById("settings-form");
        if (settingsForm) {
            settingsForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.startGameFromSettings();
            });
        }

        const modeSelect: HTMLElement | null = document.getElementById("game-mode");
        const colorModeSelect: HTMLSelectElement | null = document.getElementById('theme-mode') as HTMLSelectElement;

        if (modeSelect && colorModeSelect) {
            modeSelect.addEventListener("change", (e) => {
                const selectedMode: ThemeKey = (e.target as HTMLSelectElement).value as ThemeKey;
                if (selectedMode in themes) {
                    this._currentThemeKey = selectedMode;
                    this.applyThemeConfig();
                } else {
                    console.warn(`Unknown game mode: ${selectedMode}`);
                }
            });
            colorModeSelect.addEventListener('change', () => {
                document.documentElement.setAttribute('data-theme', colorModeSelect.value);
            });
        }
    }

    private startGameFromSettings(): void {
        if (this._currentGameUI) {
            this._currentGameUI.destroy();
        }

        const rows = Number((document.getElementById("rows") as HTMLInputElement).value);
        const cols = Number((document.getElementById("cols") as HTMLInputElement).value);
        const difficulty: string = (document.getElementById("difficulty") as HTMLSelectElement).value;

        this._currentGameUI = new GameUI(this.rootElementId, rows, cols, difficulty);
        this._currentGameUI.renderBoard();
        this.applyThemeConfig();
    }

    private applyThemeConfig(): void {
        const gameTitleElement: HTMLElement | null = document.getElementById("game-title");
        const bombCounterElement: HTMLElement | null = document.getElementById("bomb-counter");

        if (!this._currentGameUI || !gameTitleElement || !bombCounterElement) {
            return;
        }

        const currentTheme: ThemeConfig = themes[this._currentThemeKey];

        document.title = currentTheme.title;
        gameTitleElement.textContent = currentTheme.title;
        bombCounterElement.innerHTML = `${currentTheme.bombName}: <span id="bomb-count">${this._currentGameUI.getGame().board.bombCount}</span>`;

        this._currentGameUI.setBombIcon(currentTheme.icon);
        this._currentGameUI.setBombCountElement();

        this.applyColorConfig(currentTheme.colors);
    }

    private applyColorConfig(colors: Record<string, string>): void {
        const root: HTMLElement = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
    }
}
