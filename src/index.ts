import { GameController } from "./gamecontroller.js";

function init(): void {
    const controller: GameController = new GameController("board");
    controller.init();
}

init();