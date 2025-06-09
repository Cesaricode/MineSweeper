import { themes, ThemeKey } from "./themes.js";
import { Game } from "./game.js";
import { ThemeManager } from "./thememanager.js";
import { UIRenderer } from "./uirenderer.js";
import { SoundManager } from "./soundmanager.js";

export class GameController {

    private _game: Game | null = null;
    private _ui: UIRenderer;
    private _themeManager: ThemeManager;
    private _soundManager: SoundManager;
    private _currentThemeKey: ThemeKey = "minesweeper";

    constructor() {
        this._ui = new UIRenderer();
        this._themeManager = new ThemeManager();
        this._soundManager = new SoundManager();
        this.setupUICallbacks();
    }

    init(): void {
        this.bindEvents();
        this.bindSoundToggle();
        this.startGameFromSettings();
    }

    private bindEvents(): void {
        this.bindSettingsForm();
        this.bindThemeSelectors();
    }

    private bindSettingsForm(): void {
        const settingsForm: HTMLElement | null = document.getElementById("settings-form");
        if (!settingsForm) return;

        settingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                this.startGameFromSettings();
            } catch (err) {
                alert((err as Error).message);
            }
        });
    }

    private bindThemeSelectors(): void {
        const themeSelect: HTMLSelectElement | null = document.getElementById("theme-mode") as HTMLSelectElement | null;
        const darkModeSelect: HTMLSelectElement | null = document.getElementById("dark-mode") as HTMLSelectElement | null;

        if (!themeSelect || !darkModeSelect) return;

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

        darkModeSelect.addEventListener("change", () => {
            try {
                this._themeManager.toggleDarkMode();
            } catch (err) {
                alert((err as Error).message);
            }
        });
    }

    private bindSoundToggle(): void {
        const btn: HTMLElement | null = document.getElementById("sound-toggle") as HTMLButtonElement | null;
        if (!btn) return;

        const saved: string | null = localStorage.getItem("minesweeper-sound-muted");
        if (saved !== null) {
            const muted: boolean = saved === "true";
            this._soundManager.setMuted(muted);
            btn.ariaPressed = muted ? "true" : "false";
            btn.textContent = muted ? "🔇" : "🔊";
        }

        btn.addEventListener("click", () => {
            const muted: boolean = !this._soundManager.muted;
            this._soundManager.setMuted(muted);
            btn.ariaPressed = muted ? "true" : "false";
            btn.textContent = muted ? "🔇" : "🔊";
            localStorage.setItem("minesweeper-sound-muted", muted ? "true" : "false");
        });
    }

    private startGameFromSettings(): void {
        this._ui.reset();

        const rows: number = Number((document.getElementById("rows") as HTMLInputElement).value);
        const cols: number = Number((document.getElementById("cols") as HTMLInputElement).value);
        const difficulty: string = (document.getElementById("difficulty") as HTMLSelectElement).value;

        this._game = new Game(rows, cols, difficulty);

        this.setGameEventListeners();
        this.applyThemeConfig();
        this._ui.setBoardEventHandlers(this._game);
        this._ui.renderBoard(this._game);
        this._ui.updateBombCount(this._game);
    }

    private setGameEventListeners(): void {
        if (!this._game) throw new Error("Cannot set game event listeners - missing game");

        this._game.addEventListener("tileRevealed", (e: Event) => {
            this._soundManager.playTileClick();
            const detail: { row: number; col: number; } = (e as CustomEvent).detail as { row: number; col: number; };
            if (detail && typeof detail.row === "number" && typeof detail.col === "number") {
                this._ui.updateTile(this._game!, detail.row, detail.col);
            } else {
                this._ui.renderBoard(this._game!);
            }
            this._ui.updateBombCount(this._game!);
        });

        this._game.addEventListener("flagToggled", (e: Event) => {
            this._soundManager.playFlag();
            const detail: { row: number; col: number; } = (e as CustomEvent).detail as { row: number; col: number; };
            if (detail && typeof detail.row === "number" && typeof detail.col === "number") {
                this._ui.updateTile(this._game!, detail.row, detail.col);
            } else {
                this._ui.renderBoard(this._game!);
            }
            this._ui.updateBombCount(this._game!);
        });

        this._game.addEventListener("gameWon", () => {
            this._soundManager.playVictory();
            this._ui.endGame(this._game!);
            this._ui.showGameOverScreen("You won!");
        });

        this._game.addEventListener("gameLost", () => {
            this._soundManager.playBomb();
            this._ui.endGame(this._game!);
            this._ui.showGameOverScreen("You lost!");
        });
    }

    private applyThemeConfig(): void {
        if (!this._game) return;
        this._themeManager.setTheme(this._currentThemeKey);
        this._themeManager.applyTheme(this._game.board.bombCount);
        this._ui.setBombIcon(this._themeManager.theme.icon);
        this._ui.setBombCountElement();
    }

    private setupUICallbacks(): void {
        this._ui.onRestartClicked(() => {
            this._ui.hideGameOverScreen();
            this.startGameFromSettings();
        });

        this._ui.onCloseClicked(() => {
            this._ui.hideGameOverScreen();
        });
    }
}
