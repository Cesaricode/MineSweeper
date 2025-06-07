import { GameUI } from "./ui.js";
import { ThemeConfig, themes, ThemeKey } from "./themes.js";

function init(): void {
    const settingsForm: HTMLElement | null = document.getElementById("settings-form");

    let currentGameUI: GameUI | null = null;
    let currentThemeKey: ThemeKey = "minesweeper";

    function startGameFromSettings(): void {
        if (currentGameUI !== null) {
            currentGameUI.destroy();
        }

        const rows: number = Number((document.getElementById("rows") as HTMLInputElement).value);
        const cols: number = Number((document.getElementById("cols") as HTMLInputElement).value);
        const difficulty: string = (document.getElementById("difficulty") as HTMLSelectElement).value;

        currentGameUI = new GameUI("board", rows, cols, difficulty);
        currentGameUI.renderBoard();
        applyThemeConfig();
    }

    function applyThemeConfig(): void {
        let currentTheme: ThemeConfig = themes[currentThemeKey];

        document.title = currentTheme.title;
        document.getElementById("game-title")!.textContent = currentTheme.title;
        document.getElementById("bomb-counter")!.innerHTML = `${currentTheme.bombName} <span id="bomb-count">${currentGameUI?.getGame().board.bombCount}</span>`;

        currentGameUI!.setBombIcon(currentTheme.icon);
        currentGameUI!.setBombCountElement();

        applyColorConfig(currentTheme.colors);
    }

    function applyColorConfig(colors: Record<string, string>): void {
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
    }

    if (settingsForm !== null) {
        settingsForm.addEventListener("submit", (e: Event): void => {
            e.preventDefault();
            startGameFromSettings();
        });
    } else {
        console.error("Settings form not found.");
    }

    document.getElementById("game-mode")!.addEventListener("change", (e) => {
        const selectedMode = (e.target as HTMLSelectElement).value as ThemeKey;
        if (selectedMode in themes) {
            currentThemeKey = selectedMode;
            applyThemeConfig();
        } else {
            console.warn(`Unknown game mode selected: ${selectedMode}`);
        }
    });

    startGameFromSettings();
}

init();