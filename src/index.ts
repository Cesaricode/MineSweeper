import { GameUI } from "./ui.js";

function init(): void {
    const settingsForm: HTMLElement | null = document.getElementById("settings-form");
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


function startGameFromSettings() {
    const rows: number = Number((document.getElementById("rows") as HTMLInputElement).value);
    const cols: number = Number((document.getElementById("cols") as HTMLInputElement).value);
    const difficulty: string = (document.getElementById("difficulty") as HTMLSelectElement).value;

    const gameUI = new GameUI("board", rows, cols, difficulty);
    gameUI.renderBoard();
}

init();