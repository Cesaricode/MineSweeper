import { themes, ThemeKey } from "./themes.js";
import { Game } from "./game.js";
import { ThemeManager } from "./thememanager.js";
import { UIRenderer } from "./uirenderer.js";
import { SoundManager } from "./soundmanager.js";
import { SavedGameState } from "./util.js";

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
        this.tryRestoreSavedGame();
    }

    private bindEvents(): void {
        this.bindSettingsForm();
        this.bindThemeSelect();
        this.bindDarkModeSelect();
        this.bindBeforeUnload();
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

    private bindThemeSelect(): void {
        const themeSelect: HTMLSelectElement | null = document.getElementById("theme-mode") as HTMLSelectElement | null;
        if (!themeSelect) return;

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
    }

    private bindDarkModeSelect(): void {
        const darkModeSelect: HTMLSelectElement | null = document.getElementById("dark-mode") as HTMLSelectElement | null;
        if (!darkModeSelect) return;

        darkModeSelect.addEventListener("change", () => {
            try {
                this._themeManager.toggleDarkMode();
            } catch (err) {
                alert((err as Error).message);
            }
        });
    }

    private bindBeforeUnload(): void {
        window.addEventListener("beforeunload", () => {
            this.saveGame();
        });
    }

    private initializeSoundToggleButton(btn: HTMLButtonElement): void {
        const saved: string | null = localStorage.getItem("minesweeper-sound-muted");
        if (saved !== null) {
            const muted: boolean = saved === "true";
            this._soundManager.setMuted(muted);
            btn.ariaPressed = muted ? "true" : "false";
            btn.textContent = muted ? "🔇" : "🔊";
        }
    }

    private handleSoundToggleClick(btn: HTMLButtonElement): void {
        btn.addEventListener("click", () => {
            const muted: boolean = !this._soundManager.muted;
            this._soundManager.setMuted(muted);
            btn.ariaPressed = muted ? "true" : "false";
            btn.textContent = muted ? "🔇" : "🔊";
            localStorage.setItem("minesweeper-sound-muted", muted ? "true" : "false");
        });
    }

    private bindSoundToggle(): void {
        const btn: HTMLButtonElement | null = document.getElementById("sound-toggle") as HTMLButtonElement | null;
        if (!btn) return;
        this.initializeSoundToggleButton(btn);
        this.handleSoundToggleClick(btn);
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

    private handleTileRevealed = (e: Event): void => {
        this._soundManager.playTileClick();
        const detail: { row: number; col: number; } = (e as CustomEvent).detail as { row: number; col: number; };
        if (detail && typeof detail.row === "number" && typeof detail.col === "number") {
            this._ui.updateTile(this._game!, detail.row, detail.col);
        } else {
            this._ui.renderBoard(this._game!);
        }
        this._ui.updateBombCount(this._game!);
        this.saveGame();
    };

    private handleFlagToggled = (e: Event): void => {
        this._soundManager.playFlag();
        const detail: { row: number; col: number; } = (e as CustomEvent).detail as { row: number; col: number; };
        if (detail && typeof detail.row === "number" && typeof detail.col === "number") {
            this._ui.updateTile(this._game!, detail.row, detail.col);
        } else {
            this._ui.renderBoard(this._game!);
        }
        this._ui.updateBombCount(this._game!);
        this.saveGame();
    };

    private handleGameWon = (): void => {
        this._soundManager.playVictory();
        this._ui.endGame(this._game!);
        this._ui.showGameOverScreen("You won!");
        this.deleteSaveGame();
    };

    private handleGameLost = (): void => {
        this._soundManager.playBomb();
        this._ui.endGame(this._game!);
        this._ui.showGameOverScreen("You lost!");
        this.deleteSaveGame();
    };

    private setGameEventListeners(): void {
        if (!this._game) throw new Error("Cannot set game event listeners - missing game");

        this._game.addEventListener("tileRevealed", this.handleTileRevealed);
        this._game.addEventListener("flagToggled", this.handleFlagToggled);
        this._game.addEventListener("gameWon", this.handleGameWon);
        this._game.addEventListener("gameLost", this.handleGameLost);
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

    private saveGame(): void {
        if (!this._game || this._game.status !== "playing") return;
        const elapsedTime: number = this._ui.elapsedTime;
        const state: SavedGameState = {
            rows: this._game!.board.rows,
            cols: this._game!.board.cols,
            difficulty: this._game!.difficulty,
            board: this._game!.board.grid.map(row =>
                row.map(tile => ({
                    status: tile.status,
                    isBomb: tile.isBomb(),
                    adjacentBombCount: tile.adjacentBombCount
                }))
            ),
            elapsedTime,
            status: this._game!.status
        };
        localStorage.setItem("minesweeper-save", JSON.stringify(state));
    }

    private loadGame(): SavedGameState | null {
        const data: string | null = localStorage.getItem("minesweeper-save");
        if (!data) return null;
        try {
            return JSON.parse(data) as SavedGameState;
        } catch {
            return null;
        }
    }

    private restoreSaveGame(state: SavedGameState): void {
        const game: Game = new Game(state.rows, state.cols, state.difficulty);
        game.restoreBoardState(state);
        this._game = game;
        this.setGameEventListeners();
        this.applyThemeConfig();

        this._ui.setElapsedTime(state.elapsedTime);
        this._ui.setBoardEventHandlers(this._game);
        this._ui.renderBoard(this._game);
        this._ui.updateBombCount(this._game);
    }

    private deleteSaveGame(): void {
        localStorage.removeItem("minesweeper-save");
    }

    private tryRestoreSavedGame(): void {
        const saved: SavedGameState | null = this.loadGame();
        if (saved) {
            this.restoreSaveGame(saved);
        }
    }
}
