export class Tile {
    constructor(row, col) {
        this.status = "hidden";
        this.isBomb = false;
        this.adjacentBombCount = 0;
        this.row = row;
        this.col = col;
    }
    setStatus(status) {
        this.status = status;
    }
    setAdjacentBombCount(count) {
        this.adjacentBombCount = count;
    }
    setBomb() {
        this.isBomb = true;
    }
}
