import { GameUI } from "./ui.js";

function init(): void {
    const settingsForm: HTMLElement | null = document.getElementById("settings-form");

    let currentGameUI: GameUI | null = null;

    function startGameFromSettings(): void {
        if (currentGameUI !== null) {
            currentGameUI.destroy();
        }

        const rows: number = Number((document.getElementById("rows") as HTMLInputElement).value);
        const cols: number = Number((document.getElementById("cols") as HTMLInputElement).value);
        const difficulty: string = (document.getElementById("difficulty") as HTMLSelectElement).value;

        currentGameUI = new GameUI("board", rows, cols, difficulty);
        currentGameUI.renderBoard();
    }

    if (settingsForm !== null) {
        settingsForm.addEventListener("submit", (e: Event): void => {
            e.preventDefault();
            startGameFromSettings();
        });
    } else {
        console.error("Settings form not found.");
    }

    startGameFromSettings();
}

init();