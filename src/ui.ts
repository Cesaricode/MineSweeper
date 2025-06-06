import { Game } from "./game.js";

const game = new Game(20, 20, "easy");

export function renderBoard(): void {
    const boardEl = document.getElementById("board")!;
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${game.cols}, 30px)`;

    for (let row = 0; row < game.rows; row++) {
        for (let col = 0; col < game.cols; col++) {
            const tile = game.getTile(row, col);
            const tileEl = document.createElement("div");
            tileEl.className = "tile";
            tileEl.dataset.row = row.toString();
            tileEl.dataset.col = col.toString();

            if (tile.status === "revealed") {
                tileEl.classList.add("revealed");
                tileEl.textContent = tile.isBomb ? "💣" : tile.adjacentBombCount ? tile.adjacentBombCount.toString() : "";
                tileEl.dataset.value = tile.adjacentBombCount.toString();
            } else if (tile.status === "flagged") {
                tileEl.classList.add("flagged");
                tileEl.textContent = "🚩";
            } else if (tile.status === "wrong-flag") {
                tileEl.classList.add("wrong-flag");
                tileEl.textContent = "❌";
            } else {
                tileEl.textContent = "";
            }

            tileEl.addEventListener("click", () => {
                try {
                    game.reveal(row, col);
                    renderBoard();
                } catch (e) {
                    alert((e as Error).message);
                }
            });

            tileEl.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                try {
                    game.toggleFlag(row, col);
                    renderBoard();
                } catch (e) {
                    alert((e as Error).message);
                }
            });

            boardEl.appendChild(tileEl);
        }
    }

    const status = game.getStatus();
    if (status !== "playing") {
        setTimeout(() => alert(`You ${status}!`), 100);
    }
}
