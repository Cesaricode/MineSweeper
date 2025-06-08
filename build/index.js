import { GameController } from "./gamecontroller.js";
function init() {
    const controller = new GameController("board");
    controller.init();
}
init();
