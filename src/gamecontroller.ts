import { themes, ThemeKey } from "./themes.js";
import { Game } from "./game.js";
import { ThemeManager } from "./thememanager.js";
import { UIRenderer } from "./uirenderer.js";

export class GameController {

    private _game: Game | null = null;
    private _ui: UIRenderer;
    private _themeManager: ThemeManager;
    private _currentThemeKey: ThemeKey = "minesweeper";

    constructor() {
        this._themeManager = new ThemeManager();
        this._ui = new UIRenderer();
    }

    init(): void {
        this.bindEvents();
        this.startGameFromSettings();
    }

    private bindEvents(): void {
        const settingsForm: HTMLElement | null = document.getElementById("settings-form");
        if (settingsForm) {
            settingsForm.addEventListener("submit", (e) => {
                e.preventDefault();
                try {
                    this.startGameFromSettings();
                } catch (err) {
                    alert((err as Error).message);
                }
            });
        }

        const themeSelect: HTMLElement | null = document.getElementById("theme-mode");
        const darkModeSelect: HTMLSelectElement | null = document.getElementById('dark-mode') as HTMLSelectElement;

        if (themeSelect && darkModeSelect) {
            themeSelect.addEventListener("change", (e) => {
                try {
                    const selectedMode: ThemeKey = (e.target as HTMLSelectElement).value as ThemeKey;
                    if (selectedMode in themes) {
                        this._currentThemeKey = selectedMode;
                        this.applyThemeConfig();
                    } else {
                        throw new Error(`Unknown game mode: ${selectedMode}`);
                    }
                } catch (err) {
                    alert((err as Error).message);
                }
            });
            darkModeSelect.addEventListener('change', () => {
                try {
                    this._themeManager.toggleDarkMode();
                } catch (err) {
                    alert((err as Error).message);
                }
            });
        }
    }

    private startGameFromSettings(): void {
        this._ui.reset();

        const rows: number = Number((document.getElementById("rows") as HTMLInputElement).value);
        const cols: number = Number((document.getElementById("cols") as HTMLInputElement).value);
        const difficulty: string = (document.getElementById("difficulty") as HTMLSelectElement).value;

        this._game = new Game(rows, cols, difficulty);

        this.applyThemeConfig();
        this._ui.renderBoard(this._game);
        this._ui.updateBombCount(this._game);
    }

    private applyThemeConfig(): void {
        if (!this._game) return;
        this._themeManager.setTheme(this._currentThemeKey);
        this._themeManager.applyTheme(this._game.board.bombCount);
        this._ui.setBombIcon(this._themeManager.theme.icon);
        this._ui.setBombCountElement();
    }
}
